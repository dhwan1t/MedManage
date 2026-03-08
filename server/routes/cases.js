const router = require("express").Router();
const Case = require("../models/Case");
const Patient = require("../models/Patient");
const Hospital = require("../models/Hospital");
const Ambulance = require("../models/Ambulance");
const { verifyToken, verifyRole } = require("../middleware/auth");
const { calculateSeverity } = require("../ai/severityAggregator");
const { rankHospitals } = require("../ai/hospitalRanker");

// ─────────────────────────────────────────────────────────────
// Helper: Ownership scoping — returns a Mongoose filter that
// restricts case access based on the authenticated user's role.
// - admin:     can see all cases
// - hospital:  can see cases assigned to their hospital
// - ambulance: can see cases assigned to their ambulance
// - public:    no access (blocked by verifyRole before this)
// ─────────────────────────────────────────────────────────────
async function buildOwnershipFilter(user) {
  const { role, userId, hospitalId, ambulanceId } = user;

  if (role === "admin") {
    return {}; // no restriction
  }

  if (role === "hospital") {
    if (hospitalId) {
      return {
        $or: [{ hospital: hospitalId }, { selectedHospital: hospitalId }],
      };
    }
    // Fallback: look up the user's hospitalId from the DB
    const UserModel = require("../models/User");
    const dbUser = await UserModel.findById(userId);
    if (dbUser && dbUser.hospitalId) {
      return {
        $or: [
          { hospital: dbUser.hospitalId },
          { selectedHospital: dbUser.hospitalId },
        ],
      };
    }
    // Hospital user with no linked hospital — return nothing
    return { _id: null };
  }

  if (role === "ambulance") {
    if (ambulanceId) {
      return { ambulance: ambulanceId };
    }
    // Fallback: find ambulance by operatorId
    const amb = await Ambulance.findOne({ operatorId: userId });
    if (amb) {
      return { ambulance: amb._id };
    }
    return { _id: null };
  }

  // Default: no results
  return { _id: null };
}

// ─────────────────────────────────────────────────────────────
// Helper: Push a timeline event only if it hasn't been added
// in the last N seconds (dedup guard — P1-07).
// ─────────────────────────────────────────────────────────────
function pushTimelineEvent(caseObj, eventName, dedupWindowMs = 5000) {
  const now = new Date();
  const isDuplicate = caseObj.timeline.some((entry) => {
    if (entry.event !== eventName) return false;
    const timeDiff = now.getTime() - new Date(entry.timestamp).getTime();
    return timeDiff < dedupWindowMs;
  });

  if (!isDuplicate) {
    caseObj.timeline.push({ event: eventName, timestamp: now });
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Find a case by _id or caseId string, with optional
// ownership filter applied.
// ─────────────────────────────────────────────────────────────
async function findCaseByIdOrCaseId(id, ownershipFilter, populateFields) {
  const popFields = populateFields || [];

  // Try by MongoDB _id first
  let query;
  try {
    query = Case.findOne({ _id: id, ...ownershipFilter });
    popFields.forEach((f) => {
      query = query.populate(f);
    });
    const result = await query;
    if (result) return result;
  } catch (err) {
    // If _id is not a valid ObjectId, fall through to caseId search
    if (err.kind !== "ObjectId" && err.name !== "CastError") throw err;
  }

  // Try by caseId string
  query = Case.findOne({ caseId: id, ...ownershipFilter });
  popFields.forEach((f) => {
    query = query.populate(f);
  });
  return await query;
}

// ═════════════════════════════════════════════════════════════
// P1-04: GET /api/cases — List cases with ownership scoping
// ═════════════════════════════════════════════════════════════
router.get(
  "/",
  verifyToken,
  verifyRole("admin", "hospital", "ambulance"),
  async (req, res) => {
    try {
      const ownershipFilter = await buildOwnershipFilter(req.user);

      // Optional query params
      const { status, limit, page } = req.query;
      const filter = { ...ownershipFilter };

      if (status) {
        const allowedStatuses = [
          "dispatched",
          "en_route",
          "arrived",
          "completed",
        ];
        if (allowedStatuses.includes(status)) {
          filter.status = status;
        }
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * pageSize;

      const [cases, total] = await Promise.all([
        Case.find(filter)
          .populate("patient")
          .populate("ambulance")
          .populate("selectedHospital")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize),
        Case.countDocuments(filter),
      ]);

      res.json({
        cases,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize),
        },
      });
    } catch (err) {
      console.error("cases GET / error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// GET /api/cases/hospital/active — Active cases for the logged-in hospital
// Returns cases where selectedHospital matches the user's hospitalId
// and status is 'en_route' or 'dispatched'.
// ═════════════════════════════════════════════════════════════
router.get(
  "/hospital/active",
  verifyToken,
  verifyRole("hospital", "admin"),
  async (req, res) => {
    try {
      const { role, hospitalId, userId } = req.user;

      let hId = hospitalId;
      if (!hId && role === "hospital") {
        const UserModel = require("../models/User");
        const dbUser = await UserModel.findById(userId);
        if (dbUser) hId = dbUser.hospitalId;
      }

      const filter = {
        status: { $in: ["en_route", "dispatched"] },
      };

      // Admin sees all active cases; hospital sees only their own
      if (role === "hospital" && hId) {
        filter.selectedHospital = hId;
      } else if (role === "hospital") {
        return res.json([]);
      }

      const cases = await Case.find(filter)
        .populate("patient")
        .populate("ambulance")
        .populate("selectedHospital")
        .sort({ createdAt: -1 });

      res.json(cases);
    } catch (err) {
      console.error("cases GET /hospital/active error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// GET /api/cases/:id — Fetch a single case with populated data
// ═════════════════════════════════════════════════════════════
router.get(
  "/:id",
  verifyToken,
  verifyRole("admin", "hospital", "ambulance"),
  async (req, res) => {
    try {
      const ownershipFilter = await buildOwnershipFilter(req.user);
      const caseObj = await findCaseByIdOrCaseId(
        req.params.id,
        ownershipFilter,
        ["patient", "ambulance", "selectedHospital"],
      );

      if (!caseObj) {
        return res.status(404).json({ msg: "Case not found" });
      }

      res.json(caseObj);
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Case not found" });
      }
      console.error("cases GET /:id error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// POST /api/cases/create — Create a new case
// Only ambulance operators and admins can create cases.
// ═════════════════════════════════════════════════════════════
router.post(
  "/create",
  verifyToken,
  verifyRole("ambulance", "admin"),
  async (req, res) => {
    try {
      const { ambulanceId, patientName, emergencyType, location } = req.body;

      // Create new Patient
      const newPatient = new Patient({
        name: patientName || "Unknown",
        vitals: { chiefComplaint: emergencyType || "Unknown" },
      });

      // Create new Case
      const newCase = new Case({
        patient: newPatient._id,
        ambulance: ambulanceId || undefined,
        status: "dispatched",
        timeline: [{ event: "dispatched", timestamp: new Date() }],
      });

      // Link Case to Patient
      newPatient.caseId = newCase._id;

      await newPatient.save();
      const savedCase = await newCase.save();

      // Emit socket event to admin room
      const io = req.app.get("io");
      if (io) {
        io.to("admin").emit("case:created", {
          caseId: savedCase.caseId,
          caseObjectId: savedCase._id,
          status: savedCase.status,
        });
      }

      res.status(201).json({
        caseId: savedCase.caseId,
        caseObjectId: savedCase._id,
        status: savedCase.status,
      });
    } catch (err) {
      console.error("cases POST /create error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// PUT /api/cases/:id/update-vitals
// Only ambulance operators and admins can update vitals.
//
// P0-06: Vitals broadcast is scoped to the assigned hospital's
//        room instead of being emitted globally.
// P1-07: Timeline dedup guard on vitals_updated events.
// ═════════════════════════════════════════════════════════════
router.put(
  "/:id/update-vitals",
  verifyToken,
  verifyRole("ambulance", "admin"),
  async (req, res) => {
    try {
      const vitalsInput = req.body;

      // ── Find the case (with ownership scoping) ──
      const ownershipFilter = await buildOwnershipFilter(req.user);
      const caseObj = await findCaseByIdOrCaseId(
        req.params.id,
        ownershipFilter,
      );
      if (!caseObj) {
        return res.status(404).json({ msg: "Case not found" });
      }

      const patientObj = await Patient.findById(caseObj.patient);
      if (!patientObj) {
        return res.status(404).json({ msg: "Patient not found" });
      }

      // ── Map client field names -> model/AI field names ──
      const mapped = {};

      if (vitalsInput.heartRate != null) {
        mapped.heartRate = parseFloat(vitalsInput.heartRate);
      }

      if (vitalsInput.systolicBP != null) {
        mapped.systolic = parseFloat(vitalsInput.systolicBP);
      } else if (vitalsInput.systolic != null) {
        mapped.systolic = parseFloat(vitalsInput.systolic);
      }

      if (vitalsInput.diastolicBP != null) {
        mapped.diastolic = parseFloat(vitalsInput.diastolicBP);
      } else if (vitalsInput.diastolic != null) {
        mapped.diastolic = parseFloat(vitalsInput.diastolic);
      }

      if (vitalsInput.respiratoryRate != null) {
        mapped.respiratoryRate = parseFloat(vitalsInput.respiratoryRate);
      }

      if (vitalsInput.temperature != null) {
        mapped.temperature = parseFloat(vitalsInput.temperature);
      }

      if (vitalsInput.spO2 != null) {
        mapped.oxygenSat = parseFloat(vitalsInput.spO2);
      } else if (vitalsInput.oxygenSat != null) {
        mapped.oxygenSat = parseFloat(vitalsInput.oxygenSat);
      }

      if (vitalsInput.consciousness != null) {
        mapped.consciousness = vitalsInput.consciousness;
      }

      if (vitalsInput.chiefComplaint != null) {
        mapped.chiefComplaint = vitalsInput.chiefComplaint;
      }

      if (vitalsInput.age != null) {
        mapped.age = parseFloat(vitalsInput.age);
      }

      if (vitalsInput.conditions != null) {
        mapped.conditions = Array.isArray(vitalsInput.conditions)
          ? vitalsInput.conditions
          : [vitalsInput.conditions];
        mapped.conditions = mapped.conditions.filter((c) => c && c !== "None");
      }

      if (vitalsInput.patientLat != null) {
        mapped.patientLat = parseFloat(vitalsInput.patientLat);
      }

      if (vitalsInput.patientLng != null) {
        mapped.patientLng = parseFloat(vitalsInput.patientLng);
      }

      // ── Extended assessment fields (P3 — 9 new scoring models) ──
      if (vitalsInput.onSupplementalOxygen != null) {
        mapped.onSupplementalOxygen = !!vitalsInput.onSupplementalOxygen;
      }

      if (vitalsInput.facialDroop != null) {
        mapped.facialDroop = !!vitalsInput.facialDroop;
      }

      if (vitalsInput.armDrift != null) {
        mapped.armDrift = !!vitalsInput.armDrift;
      }

      if (vitalsInput.speechAbnormality != null) {
        mapped.speechAbnormality = !!vitalsInput.speechAbnormality;
      }

      if (vitalsInput.nursingHomeResident != null) {
        mapped.nursingHomeResident = !!vitalsInput.nursingHomeResident;
      }

      // ── Merge into existing vitals ──
      const existingVitals = patientObj.vitals
        ? patientObj.vitals.toObject
          ? patientObj.vitals.toObject()
          : { ...patientObj.vitals }
        : {};

      patientObj.vitals = { ...existingVitals, ...mapped };

      // ── Calculate severity using AI Engine ──
      const severity = calculateSeverity(patientObj.vitals);
      patientObj.severity = severity;

      await patientObj.save();

      // ── Update timeline with dedup guard (P1-07) ──
      pushTimelineEvent(caseObj, "vitals_updated");
      await caseObj.save();

      // ── P0-06: Emit vitals update ONLY to the assigned hospital's room ──
      // Also emit to the ambulance's room and the admin room.
      // NOT globally.
      const io = req.app.get("io");
      if (io) {
        const vitalsPayload = {
          caseId: caseObj.caseId,
          caseObjectId: caseObj._id,
          severity: patientObj.severity,
          vitals: patientObj.vitals,
        };

        // Emit to the assigned hospital if one is set
        if (caseObj.hospital) {
          io.to(caseObj.hospital.toString()).emit(
            "patient:vitals_update",
            vitalsPayload,
          );
        }
        if (
          caseObj.selectedHospital &&
          caseObj.selectedHospital.toString() !==
            (caseObj.hospital || "").toString()
        ) {
          io.to(caseObj.selectedHospital.toString()).emit(
            "patient:vitals_update",
            vitalsPayload,
          );
        }

        // Emit to the assigned ambulance's room
        if (caseObj.ambulance) {
          io.to(caseObj.ambulance.toString()).emit(
            "patient:vitals_update",
            vitalsPayload,
          );
        }

        // Emit to admin room
        io.to("admin").emit("patient:vitals_update", vitalsPayload);
      }

      res.json({
        severity: patientObj.severity,
        vitals: patientObj.vitals,
      });
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Case not found" });
      }
      console.error("cases PUT /:id/update-vitals error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// GET /api/cases/:id/recommendation
// Ambulance operators and admins can get hospital recommendations.
// ═════════════════════════════════════════════════════════════
router.get(
  "/:id/recommendation",
  verifyToken,
  verifyRole("ambulance", "admin"),
  async (req, res) => {
    try {
      const ownershipFilter = await buildOwnershipFilter(req.user);
      const caseObj = await findCaseByIdOrCaseId(
        req.params.id,
        ownershipFilter,
      );
      if (!caseObj) {
        return res.status(404).json({ msg: "Case not found" });
      }

      const patientObj = await Patient.findById(caseObj.patient);
      if (!patientObj) {
        return res.status(404).json({ msg: "Patient not found" });
      }

      // ── Determine which hospitals to consider ──
      const severity = patientObj.severity || { canWait: true, score: 0 };
      let statusFilter;
      if (severity && !severity.canWait) {
        statusFilter = {
          status: { $in: ["accepting", "emergency_only"] },
        };
      } else {
        statusFilter = { status: "accepting" };
      }

      const hospitals = await Hospital.find(statusFilter);

      // ── Build vitals object for ranker ──
      const vitals = patientObj.vitals
        ? patientObj.vitals.toObject
          ? patientObj.vitals.toObject()
          : { ...patientObj.vitals }
        : {};

      // ── Fallback: if vitals lack patient coords, use ambulance's currentLocation ──
      if (vitals.patientLat == null || vitals.patientLng == null) {
        if (caseObj.ambulance) {
          const ambulance = await Ambulance.findById(caseObj.ambulance);
          if (ambulance && ambulance.currentLocation) {
            if (
              ambulance.currentLocation.lat != null &&
              vitals.patientLat == null
            ) {
              vitals.patientLat = ambulance.currentLocation.lat;
            }
            if (
              ambulance.currentLocation.lng != null &&
              vitals.patientLng == null
            ) {
              vitals.patientLng = ambulance.currentLocation.lng;
            }
          }
        }
      }

      // ── Pass severity, vitals, and all hospitals to the AI Ranker ──
      const rankedHospitals = rankHospitals(severity, vitals, hospitals);

      caseObj.aiRecommendations = rankedHospitals.map((r) => ({
        hospitalId: r.hospitalId,
        score: r.score,
        reason: r.reason,
        distance: r.distance,
      }));
      await caseObj.save();

      res.json({
        severity: patientObj.severity,
        severityScore: severity.score || 0,
        recommendations: rankedHospitals,
      });
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Case not found" });
      }
      console.error("cases GET /:id/recommendation error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// PUT /api/cases/:id/select-hospital
// Ambulance operators and admins can select a hospital for a case.
// ═════════════════════════════════════════════════════════════
router.put(
  "/:id/select-hospital",
  verifyToken,
  verifyRole("ambulance", "admin"),
  async (req, res) => {
    try {
      const { hospitalId } = req.body;

      if (!hospitalId) {
        return res.status(400).json({ msg: "hospitalId is required" });
      }

      const ownershipFilter = await buildOwnershipFilter(req.user);
      const caseObj = await findCaseByIdOrCaseId(
        req.params.id,
        ownershipFilter,
      );
      if (!caseObj) {
        return res.status(404).json({ msg: "Case not found" });
      }

      const patientObj = await Patient.findById(caseObj.patient);

      caseObj.selectedHospital = hospitalId;
      caseObj.hospital = hospitalId;
      caseObj.status = "en_route";
      pushTimelineEvent(caseObj, "en_route");

      await caseObj.save();

      // ── Build the payload that HospitalDashboard expects ──
      const patientData = patientObj
        ? {
            patientId: patientObj._id,
            name: patientObj.name,
            severity: patientObj.severity
              ? patientObj.severity.level
                ? patientObj.severity.level.toUpperCase()
                : "UNKNOWN"
              : "UNKNOWN",
            severityScore: patientObj.severity
              ? patientObj.severity.score || 0
              : 0,
            eta: caseObj.estimatedEta || "Calculating...",
            resources: [],
            vitals: patientObj.vitals || {},
          }
        : {};

      // Determine needed resources from severity
      if (patientObj && patientObj.severity) {
        const sev = patientObj.severity;
        if (sev.score > 70) patientData.resources.push("ICU");
        if (sev.flags && sev.flags.includes("critical_trauma"))
          patientData.resources.push("OT");
        if (sev.flags && sev.flags.includes("respiratory_distress"))
          patientData.resources.push("ER");
      }

      // ── Calculate a real ETA if ambulance location is available ──
      if (caseObj.ambulance) {
        const ambulance = await Ambulance.findById(caseObj.ambulance);
        const hospital = await Hospital.findById(hospitalId);
        if (
          ambulance &&
          ambulance.currentLocation &&
          hospital &&
          hospital.location
        ) {
          const { getDistance } = require("../utils/geo");
          const dist = getDistance(
            ambulance.currentLocation.lat || 0,
            ambulance.currentLocation.lng || 0,
            hospital.location.lat || 0,
            hospital.location.lng || 0,
          );
          const etaMinutes = Math.max(2, Math.round(dist * 2.5 + 2));
          patientData.eta = `~${etaMinutes} min`;
        }
      }

      // ── Emit to specific hospital's room (not globally) ──
      const io = req.app.get("io");
      if (io) {
        console.log(
          "Emitting ambulance:dispatch to room:",
          hospitalId.toString(),
        );
        io.to(hospitalId.toString()).emit("ambulance:dispatch", patientData);

        // Also emit to admin room for dashboards
        io.to("admin").emit("case:en_route", {
          caseId: caseObj.caseId,
          hospitalId,
          status: "en_route",
        });
      }

      // ── Send webhook to hospital's external system (fire-and-forget) ──
      try {
        const { sendWebhook } = require("../utils/webhook");
        const webhookHospital = await Hospital.findById(hospitalId);
        if (webhookHospital) {
          const webhookAmbulance = caseObj.ambulance
            ? await Ambulance.findById(caseObj.ambulance)
            : null;
          await sendWebhook(webhookHospital, "AMBULANCE_DISPATCHED", {
            caseId: caseObj._id,
            patientSeverity:
              patientObj && patientObj.severity
                ? patientObj.severity.score
                : null,
            patientLevel:
              patientObj && patientObj.severity
                ? patientObj.severity.level
                : null,
            flags:
              patientObj && patientObj.severity
                ? patientObj.severity.flags
                : [],
            vitals: patientObj ? patientObj.vitals : {},
            estimatedArrivalMinutes: patientData.eta || null,
            ambulanceId: webhookAmbulance ? webhookAmbulance.ambulanceId : null,
          });
        }
      } catch (webhookErr) {
        // Never let webhook errors break the main flow
        console.error(
          "Webhook dispatch error (non-fatal):",
          webhookErr.message,
        );
      }

      res.json({
        status: caseObj.status,
        caseId: caseObj.caseId,
        caseObjectId: caseObj._id,
      });
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Case not found" });
      }
      console.error("cases PUT /:id/select-hospital error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// PUT /api/cases/:id/status
// Ambulance operators, hospital staff, and admins can update status.
// ═════════════════════════════════════════════════════════════
router.put(
  "/:id/status",
  verifyToken,
  verifyRole("ambulance", "hospital", "admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "dispatched",
        "en_route",
        "arrived",
        "completed",
      ];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ msg: "Invalid status" });
      }

      const ownershipFilter = await buildOwnershipFilter(req.user);
      const caseObj = await findCaseByIdOrCaseId(
        req.params.id,
        ownershipFilter,
      );
      if (!caseObj) {
        return res.status(404).json({ msg: "Case not found" });
      }

      caseObj.status = status;
      pushTimelineEvent(caseObj, status);

      await caseObj.save();

      // ── If arrived or completed, free up the ambulance ──
      if (status === "arrived" || status === "completed") {
        if (caseObj.ambulance) {
          const ambulance = await Ambulance.findById(caseObj.ambulance);
          if (ambulance) {
            ambulance.status = "available";
            ambulance.assignedCase = null;
            await ambulance.save();
          }
        }
      }

      const io = req.app.get("io");
      if (io) {
        // Emit to relevant rooms only (not globally)
        const rooms = ["admin"];
        if (caseObj.hospital) rooms.push(caseObj.hospital.toString());
        if (caseObj.selectedHospital)
          rooms.push(caseObj.selectedHospital.toString());
        if (caseObj.ambulance) rooms.push(caseObj.ambulance.toString());

        const uniqueRooms = [...new Set(rooms)];

        if (status === "arrived") {
          uniqueRooms.forEach((room) => {
            io.to(room).emit("case:arrived", {
              caseId: caseObj.caseId,
              caseObjectId: caseObj._id,
            });
          });
        }

        // Always emit a generic status update
        uniqueRooms.forEach((room) => {
          io.to(room).emit("case:status_update", {
            caseId: caseObj.caseId,
            status: caseObj.status,
          });
        });
      }

      res.json({ status: caseObj.status, caseId: caseObj.caseId });
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Case not found" });
      }
      console.error("cases PUT /:id/status error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// ═════════════════════════════════════════════════════════════
// P1-05: GET /api/cases/:id/patient — Independent patient fetch
// ═════════════════════════════════════════════════════════════
router.get(
  "/:id/patient",
  verifyToken,
  verifyRole("ambulance", "hospital", "admin"),
  async (req, res) => {
    try {
      const ownershipFilter = await buildOwnershipFilter(req.user);
      const caseObj = await findCaseByIdOrCaseId(
        req.params.id,
        ownershipFilter,
      );
      if (!caseObj) {
        return res.status(404).json({ msg: "Case not found" });
      }

      const patient = await Patient.findById(caseObj.patient);
      if (!patient) {
        return res.status(404).json({ msg: "Patient not found" });
      }

      res.json(patient);
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(404).json({ msg: "Case not found" });
      }
      console.error("cases GET /:id/patient error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

module.exports = router;
