const router = require("express").Router();
const Hospital = require("../models/Hospital");
const Ambulance = require("../models/Ambulance");
const Case = require("../models/Case");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Alert = require("../models/Alert");
const { verifyToken, verifyRole } = require("../middleware/auth");

// ═════════════════════════════════════════════════════════════
// GET /api/admin/dashboard?city=Ludhiana
// ═════════════════════════════════════════════════════════════
router.get("/dashboard", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const { city } = req.query;

    const hospitalQuery = city
      ? { "location.address": new RegExp(city, "i") }
      : {};

    const hospitals = await Hospital.find(hospitalQuery);
    const ambulances = await Ambulance.find();

    // Get today's start and end date
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const casesToday = await Case.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalCases = await Case.countDocuments();

    const stats = {
      ambulances: ambulances.filter(
        (a) => a.status === "on_call" || a.status === "available",
      ).length,
      activeAmbulances: ambulances.filter((a) => a.status === "on_call").length,
      availableAmbulances: ambulances.filter((a) => a.status === "available")
        .length,
      totalAmbulances: ambulances.length,
      hospitalsOnline: hospitals.filter(
        (h) => h.status === "accepting" || h.status === "emergency_only",
      ).length,
      totalHospitals: hospitals.length,
      casesToday,
      totalCases,
      totalBedsAvailable: hospitals.reduce(
        (acc, curr) =>
          acc +
          (curr.resources && curr.resources.generalBeds
            ? curr.resources.generalBeds.available
            : 0),
        0,
      ),
      totalIcuAvailable: hospitals.reduce(
        (acc, curr) =>
          acc +
          (curr.resources && curr.resources.icuBeds
            ? curr.resources.icuBeds.available
            : 0),
        0,
      ),
      totalOtAvailable: hospitals.reduce(
        (acc, curr) =>
          acc +
          (curr.resources && curr.resources.otTheatres
            ? curr.resources.otTheatres.available
            : 0),
        0,
      ),
      totalErAvailable: hospitals.reduce(
        (acc, curr) =>
          acc +
          (curr.resources && curr.resources.erBays
            ? curr.resources.erBays.available
            : 0),
        0,
      ),
    };

    // Format hospitals for the dashboard table
    const formattedHospitals = hospitals.map((h) => ({
      id: h._id,
      name: h.name,
      type: h.type,
      beds: h.resources?.generalBeds
        ? `${h.resources.generalBeds.available}/${h.resources.generalBeds.total}`
        : "0/0",
      icu: h.resources?.icuBeds
        ? `${h.resources.icuBeds.available}/${h.resources.icuBeds.total}`
        : "0/0",
      ot: h.resources?.otTheatres
        ? `${h.resources.otTheatres.available}/${h.resources.otTheatres.total}`
        : "0/0",
      er: h.resources?.erBays
        ? `${h.resources.erBays.available}/${h.resources.erBays.total}`
        : "0/0",
      status: h.status,
      rating: h.rating || 0,
    }));

    res.json({
      hospitals: formattedHospitals,
      ambulances,
      casesToday,
      stats,
    });
  } catch (err) {
    console.error("admin GET /dashboard error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ═════════════════════════════════════════════════════════════
// GET /api/admin/analytics
//
// P2-02: Replaced hardcoded fake arrays with real DB aggregation.
// All data is now computed from actual Case, Patient, Hospital,
// and Ambulance documents.
// ═════════════════════════════════════════════════════════════
router.get("/analytics", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const totalCases = await Case.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalHospitals = await Hospital.countDocuments();
    const totalAmbulances = await Ambulance.countDocuments();

    // ── Weekly cases: aggregate cases per day for the last 7 days ──
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyCasesAgg = await Case.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build a full 7-day array (fill in zeros for days with no cases)
    const weeklyCases = [];
    const weeklyLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      weeklyLabels.push(dayName);
      const found = weeklyCasesAgg.find((item) => item._id === key);
      weeklyCases.push(found ? found.count : 0);
    }

    // ── Hourly cases for today (last 12 hours) ──
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    const hourlyCasesAgg = await Case.aggregate([
      { $match: { createdAt: { $gte: twelveHoursAgo } } },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patientData",
        },
      },
      { $unwind: { path: "$patientData", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $dateToString: { format: "%H:00", date: "$createdAt" } },
          total: { $sum: 1 },
          critical: {
            $sum: {
              $cond: [
                { $eq: ["$patientData.severity.level", "critical"] },
                1,
                0,
              ],
            },
          },
          urgent: {
            $sum: {
              $cond: [{ $eq: ["$patientData.severity.level", "urgent"] }, 1, 0],
            },
          },
          stable: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$patientData.severity.level", "stable"] },
                    {
                      $eq: [
                        { $type: "$patientData.severity.level" },
                        "missing",
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hourlyCasesData = hourlyCasesAgg.map((item) => ({
      hour: item._id,
      stable: item.stable,
      urgent: item.urgent,
      critical: item.critical,
    }));

    // ── Average response times: computed from timeline events ──
    // Response time = difference between first "dispatched" and "arrived" events
    const responseTimesAgg = await Case.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          "timeline.1": { $exists: true }, // Must have at least 2 timeline entries
        },
      },
      { $unwind: "$timeline" },
      {
        $group: {
          _id: "$_id",
          createdAt: { $first: "$createdAt" },
          minTime: { $min: "$timeline.timestamp" },
          maxTime: { $max: "$timeline.timestamp" },
        },
      },
      {
        $project: {
          day: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          responseMinutes: {
            $divide: [
              { $subtract: ["$maxTime", "$minTime"] },
              60000, // Convert ms to minutes
            ],
          },
        },
      },
      {
        $group: {
          _id: "$day",
          avgResponse: { $avg: "$responseMinutes" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build 7-day response time array
    const responseTimesAvg = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const found = responseTimesAgg.find((item) => item._id === key);
      responseTimesAvg.push(
        found ? parseFloat(found.avgResponse.toFixed(1)) : 0,
      );
    }

    // ── Top hospitals by cases handled ──
    const topHospitalsAgg = await Case.aggregate([
      { $match: { hospital: { $ne: null } } },
      {
        $group: {
          _id: "$hospital",
          casesHandled: { $sum: 1 },
        },
      },
      { $sort: { casesHandled: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "hospitals",
          localField: "_id",
          foreignField: "_id",
          as: "hospitalData",
        },
      },
      { $unwind: { path: "$hospitalData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$hospitalData.name", "Unknown Hospital"] },
          casesHandled: 1,
        },
      },
    ]);

    const topHospitals = topHospitalsAgg.map((h) => ({
      name: h.name,
      casesHandled: h.casesHandled,
    }));

    // ── Severity distribution from all patients ──
    const severityAgg = await Patient.aggregate([
      { $match: { "severity.level": { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$severity.level",
          count: { $sum: 1 },
        },
      },
    ]);

    const severityDistribution = { high: 0, medium: 0, low: 0 };
    severityAgg.forEach((item) => {
      if (item._id === "critical") severityDistribution.high = item.count;
      else if (item._id === "urgent") severityDistribution.medium = item.count;
      else if (item._id === "stable") severityDistribution.low = item.count;
    });

    // ── Patient outcomes breakdown ──
    const outcomesAgg = await Patient.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const outcomes = {};
    outcomesAgg.forEach((item) => {
      outcomes[item._id || "unknown"] = item.count;
    });

    // ── Route analysis: recent completed cases with distance info ──
    const recentCompletedCases = await Case.find({
      status: "completed",
      selectedHospital: { $ne: null },
    })
      .populate("patient", "name")
      .populate("selectedHospital", "name")
      .populate("ambulance", "ambulanceId")
      .sort({ createdAt: -1 })
      .limit(10);

    const routeAnalysis = recentCompletedCases.map((c) => {
      // Calculate response time from timeline
      let responseTime = null;
      if (c.timeline && c.timeline.length >= 2) {
        const first = new Date(c.timeline[0].timestamp);
        const last = new Date(c.timeline[c.timeline.length - 1].timestamp);
        responseTime = Math.round((last - first) / 60000); // minutes
      }

      return {
        caseId: c.caseId,
        patientName: c.patient?.name || "Unknown",
        hospital: c.selectedHospital?.name || "Unknown",
        ambulanceId: c.ambulance?.ambulanceId || "N/A",
        responseTime: responseTime != null ? `${responseTime}m` : "N/A",
        status: c.status,
        date: c.createdAt,
      };
    });

    // ── Active cases right now ──
    const activeCases = await Case.countDocuments({
      status: { $in: ["dispatched", "en_route"] },
    });

    const analyticsData = {
      totalCases,
      totalPatients,
      totalHospitals,
      totalAmbulances,
      activeCases,
      weeklyCases,
      weeklyLabels,
      responseTimesAvg,
      responseTimeLabels: weeklyLabels,
      hourlyCasesData,
      topHospitals,
      severityDistribution,
      outcomes,
      routeAnalysis,
    };

    res.json(analyticsData);
  } catch (err) {
    console.error("admin GET /analytics error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ═════════════════════════════════════════════════════════════
// P2-08: Admin CRUD for Hospitals
// ═════════════════════════════════════════════════════════════

// GET /api/admin/hospitals — List all hospitals
router.get("/hospitals", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const { city, status } = req.query;
    const filter = {};

    if (city) filter["location.address"] = new RegExp(city, "i");
    if (status) filter.status = status;

    const hospitals = await Hospital.find(filter).sort({ name: 1 });
    res.json(hospitals);
  } catch (err) {
    console.error("admin GET /hospitals error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/admin/hospitals/:id — Get a single hospital
router.get(
  "/hospitals/:id",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const hospital = await Hospital.findById(req.params.id);
      if (!hospital) {
        return res.status(404).json({ msg: "Hospital not found" });
      }
      res.json(hospital);
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Hospital not found" });
      }
      console.error("admin GET /hospitals/:id error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// POST /api/admin/hospitals — Create a new hospital
router.post(
  "/hospitals",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const { name, type, location, resources, doctors, status, rating } =
        req.body;

      if (!name || !type) {
        return res.status(400).json({ msg: "name and type are required" });
      }

      const allowedTypes = ["govt", "private", "trust"];
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          msg: `Invalid type "${type}". Must be one of: ${allowedTypes.join(", ")}`,
        });
      }

      const hospital = new Hospital({
        name,
        type,
        location: location || {},
        resources: resources || {
          generalBeds: { total: 0, available: 0 },
          icuBeds: { total: 0, available: 0 },
          otTheatres: { total: 0, available: 0 },
          erBays: { total: 0, available: 0 },
        },
        doctors: doctors || [],
        status: status || "accepting",
        rating: rating || 0,
      });

      await hospital.save();
      res.status(201).json(hospital);
    } catch (err) {
      console.error("admin POST /hospitals error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// PUT /api/admin/hospitals/:id — Update a hospital
router.put(
  "/hospitals/:id",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const allowedFields = [
        "name",
        "type",
        "location",
        "resources",
        "doctors",
        "status",
        "rating",
        "avgResponseTime",
      ];

      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (updates.type) {
        const allowedTypes = ["govt", "private", "trust"];
        if (!allowedTypes.includes(updates.type)) {
          return res.status(400).json({
            msg: `Invalid type "${updates.type}". Must be one of: ${allowedTypes.join(", ")}`,
          });
        }
      }

      if (updates.status) {
        const allowedStatuses = ["accepting", "at_capacity", "emergency_only"];
        if (!allowedStatuses.includes(updates.status)) {
          return res.status(400).json({
            msg: `Invalid status "${updates.status}". Must be one of: ${allowedStatuses.join(", ")}`,
          });
        }
      }

      const hospital = await Hospital.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true },
      );

      if (!hospital) {
        return res.status(404).json({ msg: "Hospital not found" });
      }

      // Emit bed update to hospital's socket room
      const io = req.app.get("io");
      if (io && updates.resources) {
        io.to(hospital._id.toString()).emit("hospital:bed_update", {
          hospitalId: hospital._id,
          resources: hospital.resources,
        });
      }

      res.json(hospital);
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Hospital not found" });
      }
      console.error("admin PUT /hospitals/:id error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// DELETE /api/admin/hospitals/:id — Delete a hospital
router.delete(
  "/hospitals/:id",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      // Check if any active cases reference this hospital
      const activeCases = await Case.countDocuments({
        $or: [{ hospital: req.params.id }, { selectedHospital: req.params.id }],
        status: { $in: ["dispatched", "en_route"] },
      });

      if (activeCases > 0) {
        return res.status(400).json({
          msg: `Cannot delete: ${activeCases} active case(s) are assigned to this hospital`,
        });
      }

      const hospital = await Hospital.findByIdAndDelete(req.params.id);
      if (!hospital) {
        return res.status(404).json({ msg: "Hospital not found" });
      }

      // Unlink any users tied to this hospital
      await User.updateMany(
        { hospitalId: req.params.id },
        { $unset: { hospitalId: "" } },
      );

      res.json({ msg: "Hospital deleted", id: req.params.id });
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Hospital not found" });
      }
      console.error("admin DELETE /hospitals/:id error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// P2-08: Admin CRUD for Ambulances
// ═════════════════════════════════════════════════════════════

// GET /api/admin/ambulances — List all ambulances
router.get(
  "/ambulances",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const { status } = req.query;
      const filter = {};
      if (status) filter.status = status;

      const ambulances = await Ambulance.find(filter)
        .populate("operatorId", "name email")
        .populate("assignedCase", "caseId status")
        .sort({ ambulanceId: 1 });

      res.json(ambulances);
    } catch (err) {
      console.error("admin GET /ambulances error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// GET /api/admin/ambulances/:id — Get a single ambulance
router.get(
  "/ambulances/:id",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const ambulance = await Ambulance.findById(req.params.id)
        .populate("operatorId", "name email phone")
        .populate("assignedCase", "caseId status");

      if (!ambulance) {
        return res.status(404).json({ msg: "Ambulance not found" });
      }
      res.json(ambulance);
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Ambulance not found" });
      }
      console.error("admin GET /ambulances/:id error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// POST /api/admin/ambulances — Create a new ambulance
router.post(
  "/ambulances",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const { ambulanceId, status, currentLocation, operatorId } = req.body;

      if (!ambulanceId) {
        return res.status(400).json({ msg: "ambulanceId is required" });
      }

      // Check for duplicate ambulanceId
      const existing = await Ambulance.findOne({ ambulanceId });
      if (existing) {
        return res.status(400).json({
          msg: `Ambulance with ID "${ambulanceId}" already exists`,
        });
      }

      const ambulance = new Ambulance({
        ambulanceId,
        status: status || "off_duty",
        currentLocation: currentLocation || {},
        operatorId: operatorId || undefined,
      });

      await ambulance.save();

      // If an operator was specified, link the user back to the ambulance
      if (operatorId) {
        await User.findByIdAndUpdate(operatorId, {
          ambulanceId: ambulance._id,
        });
      }

      res.status(201).json(ambulance);
    } catch (err) {
      console.error("admin POST /ambulances error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// PUT /api/admin/ambulances/:id — Update an ambulance
router.put(
  "/ambulances/:id",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const allowedFields = [
        "ambulanceId",
        "status",
        "currentLocation",
        "operatorId",
      ];

      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (updates.status) {
        const allowedStatuses = ["available", "on_call", "off_duty"];
        if (!allowedStatuses.includes(updates.status)) {
          return res.status(400).json({
            msg: `Invalid status "${updates.status}". Must be one of: ${allowedStatuses.join(", ")}`,
          });
        }
      }

      // Check for duplicate ambulanceId if it's being changed
      if (updates.ambulanceId) {
        const existing = await Ambulance.findOne({
          ambulanceId: updates.ambulanceId,
          _id: { $ne: req.params.id },
        });
        if (existing) {
          return res.status(400).json({
            msg: `Ambulance with ID "${updates.ambulanceId}" already exists`,
          });
        }
      }

      const ambulance = await Ambulance.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true },
      );

      if (!ambulance) {
        return res.status(404).json({ msg: "Ambulance not found" });
      }

      // If operator changed, update the user's ambulanceId
      if (updates.operatorId) {
        // Unlink the previous operator
        await User.updateMany(
          { ambulanceId: ambulance._id },
          { $unset: { ambulanceId: "" } },
        );
        // Link the new operator
        await User.findByIdAndUpdate(updates.operatorId, {
          ambulanceId: ambulance._id,
        });
      }

      res.json(ambulance);
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Ambulance not found" });
      }
      console.error("admin PUT /ambulances/:id error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// DELETE /api/admin/ambulances/:id — Delete an ambulance
router.delete(
  "/ambulances/:id",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      // Check if the ambulance has an active case
      const activeCases = await Case.countDocuments({
        ambulance: req.params.id,
        status: { $in: ["dispatched", "en_route"] },
      });

      if (activeCases > 0) {
        return res.status(400).json({
          msg: `Cannot delete: ambulance has ${activeCases} active case(s)`,
        });
      }

      const ambulance = await Ambulance.findByIdAndDelete(req.params.id);
      if (!ambulance) {
        return res.status(404).json({ msg: "Ambulance not found" });
      }

      // Unlink any users tied to this ambulance
      await User.updateMany(
        { ambulanceId: req.params.id },
        { $unset: { ambulanceId: "" } },
      );

      res.json({ msg: "Ambulance deleted", id: req.params.id });
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Ambulance not found" });
      }
      console.error("admin DELETE /ambulances/:id error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// GET /api/admin/users — List all users (admin only)
// ═════════════════════════════════════════════════════════════
router.get("/users", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select("-password")
      .populate("hospitalId", "name")
      .populate("ambulanceId", "ambulanceId")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("admin GET /users error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ═════════════════════════════════════════════════════════════
// GET /api/admin/pending-alerts — List all pending (inactive) alerts
// ═════════════════════════════════════════════════════════════
router.get(
  "/pending-alerts",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const alerts = await Alert.find({ active: false })
        .populate("reportedBy", "name")
        .sort({ createdAt: -1 });

      res.json(alerts);
    } catch (err) {
      console.error("admin GET /pending-alerts error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// PUT /api/admin/alerts/:alertId/publish — Publish a pending alert
// ═════════════════════════════════════════════════════════════
router.put(
  "/alerts/:alertId/publish",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const alert = await Alert.findById(req.params.alertId);

      if (!alert) {
        return res.status(404).json({ msg: "Alert not found" });
      }

      alert.active = true;
      await alert.save();

      // Emit socket event so public DiseaseAlerts page can update in real-time
      const io = req.app.get("io");
      if (io) {
        io.emit("alert:published", alert);
      }

      res.json({ alert });
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Alert not found" });
      }
      console.error("admin PUT /alerts/:alertId/publish error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// GET /api/admin/live-status — Hospitals + Ambulances for LiveMap
// ═════════════════════════════════════════════════════════════
router.get(
  "/live-status",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const hospitals = await Hospital.find().select(
        "name location status resources",
      );
      const ambulances = await Ambulance.find().select(
        "ambulanceId status currentLocation",
      );

      // For each ambulance that is on_call, find its active case
      const ambulanceData = await Promise.all(
        ambulances.map(async (amb) => {
          let activeCase = null;
          if (amb.status === "on_call") {
            const c = await Case.findOne({
              ambulance: amb._id,
              status: { $in: ["dispatched", "en_route"] },
            }).select("caseId selectedHospital");
            if (c) {
              activeCase = {
                caseId: c.caseId,
                selectedHospital: c.selectedHospital,
              };
            }
          }
          return {
            _id: amb._id,
            vehicleId: amb.ambulanceId,
            status: amb.status,
            currentLocation: amb.currentLocation,
            activeCase,
          };
        }),
      );

      res.json({
        hospitals: hospitals.map((h) => ({
          _id: h._id,
          name: h.name,
          location: h.location,
          status: h.status,
          resources: h.resources,
        })),
        ambulances: ambulanceData,
      });
    } catch (err) {
      console.error("admin GET /live-status error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// PUT /api/admin/hospitals/:id/webhook
// Configure a hospital's webhook URL and enabled status.
// Admin only.
// ═════════════════════════════════════════════════════════════
router.put(
  "/hospitals/:id/webhook",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const { webhookUrl, webhookEnabled } = req.body;

      const hospital = await Hospital.findById(req.params.id);
      if (!hospital) {
        return res.status(404).json({ msg: "Hospital not found" });
      }

      // Update only the fields that were provided
      if (webhookUrl !== undefined) {
        hospital.webhookUrl = webhookUrl || null;
      }
      if (webhookEnabled !== undefined) {
        hospital.webhookEnabled = !!webhookEnabled;
      }

      await hospital.save();

      res.json({
        hospitalId: hospital._id,
        webhookUrl: hospital.webhookUrl,
        webhookEnabled: hospital.webhookEnabled,
      });
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Hospital not found" });
      }
      console.error("admin PUT /hospitals/:id/webhook error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// POST /api/admin/hospitals/:id/webhook/test
// Send a test webhook to verify the hospital's configured URL.
// Admin only.
// ═════════════════════════════════════════════════════════════
router.post(
  "/hospitals/:id/webhook/test",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const hospital = await Hospital.findById(req.params.id);
      if (!hospital) {
        return res.status(404).json({ msg: "Hospital not found" });
      }

      if (!hospital.webhookUrl) {
        return res.status(400).json({
          success: false,
          statusCode: null,
          message: "No webhook URL configured for this hospital",
        });
      }

      const { sendWebhook } = require("../utils/webhook");

      // Temporarily treat as enabled for the test, regardless of webhookEnabled flag
      const testHospital = {
        _id: hospital._id,
        webhookUrl: hospital.webhookUrl,
        webhookEnabled: true,
      };

      const result = await sendWebhook(testHospital, "TEST", {
        message: "MedManage webhook test",
        hospitalName: hospital.name,
        testedAt: new Date().toISOString(),
      });

      if (result && result.success) {
        res.json({
          success: true,
          statusCode: result.statusCode,
          message: "Webhook test delivered successfully",
        });
      } else {
        res.json({
          success: false,
          statusCode: null,
          message: "Webhook test failed — check the URL and try again",
        });
      }
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Hospital not found" });
      }
      console.error(
        "admin POST /hospitals/:id/webhook/test error:",
        err.message,
      );
      res.status(500).json({ msg: "Server error" });
    }
  },
);

module.exports = router;
