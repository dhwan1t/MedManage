const router = require("express").Router();
const Hospital = require("../models/Hospital");
const Case = require("../models/Case");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Alert = require("../models/Alert");
const { verifyToken, verifyRole } = require("../middleware/auth");

/**
 * Helper: find the hospital associated with the authenticated user.
 * Checks JWT payload first (hospitalId), then looks up the User document.
 */
async function findUserHospital(reqUser) {
  // 1. Try hospitalId from JWT payload
  if (reqUser.hospitalId) {
    const hospital = await Hospital.findById(reqUser.hospitalId);
    if (hospital) return hospital;
  }

  // 2. Fallback: look up the User document and use its hospitalId
  const user = await User.findById(reqUser.userId);
  if (user && user.hospitalId) {
    const hospital = await Hospital.findById(user.hospitalId);
    if (hospital) return hospital;
  }

  return null;
}

// GET /api/hospital/info — Get the hospital info for the authenticated user
router.get(
  "/info",
  verifyToken,
  verifyRole("hospital", "admin"),
  async (req, res) => {
    try {
      const hospital = await findUserHospital(req.user);

      if (!hospital) {
        return res.status(404).json({
          msg: "No hospital linked to this user. Please contact an admin to link your account to a hospital.",
        });
      }

      res.json(hospital);
    } catch (err) {
      console.error("hospital GET /info error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// GET /api/hospital/incoming — Fetch existing en_route cases for this hospital
// So the dashboard shows incoming ambulances even after a page refresh.
router.get(
  "/incoming",
  verifyToken,
  verifyRole("hospital", "admin"),
  async (req, res) => {
    try {
      const hospital = await findUserHospital(req.user);
      if (!hospital) {
        return res
          .status(404)
          .json({ msg: "Hospital not found for this user" });
      }

      const hId = hospital._id;

      // Find all cases that are en_route to this hospital
      const cases = await Case.find({
        status: "en_route",
        $or: [{ selectedHospital: hId }, { hospital: hId }],
      }).populate("patient");

      const incoming = cases
        .filter((c) => c.patient)
        .map((c) => {
          const p = c.patient;
          const sev = p.severity || {};

          const resources = [];
          if (sev.score > 70) resources.push("ICU");
          if (sev.flags && sev.flags.includes("critical_trauma"))
            resources.push("OT");
          if (sev.flags && sev.flags.includes("respiratory_distress"))
            resources.push("ER");

          return {
            caseId: c.caseId,
            caseObjectId: c._id,
            patientId: p._id,
            name: p.name,
            severity: sev.level ? sev.level.toUpperCase() : "UNKNOWN",
            severityScore: sev.score || 0,
            eta: c.estimatedEta || "Calculating...",
            resources,
            vitals: p.vitals || {},
          };
        });

      res.json(incoming);
    } catch (err) {
      console.error("hospital GET /incoming error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// PUT /api/hospital/availability
//
// The client (BedManagement) may send either:
//   { resourceType, available }          — original API contract
//   { type, available, total }           — what BedManagement actually sends
//
// We handle both.
router.put(
  "/availability",
  verifyToken,
  verifyRole("hospital", "admin"),
  async (req, res) => {
    try {
      const hospital = await findUserHospital(req.user);

      if (!hospital) {
        return res
          .status(404)
          .json({ msg: "Hospital not found for this user" });
      }

      // Accept both field names for compatibility
      const resourceType = req.body.resourceType || req.body.type;
      const available = req.body.available;

      if (resourceType == null || available == null) {
        return res
          .status(400)
          .json({ msg: "resourceType (or type) and available are required" });
      }

      // Map display-friendly names to schema keys
      const resourceKeyMap = {
        generalBeds: "generalBeds",
        icuBeds: "icuBeds",
        otTheatres: "otTheatres",
        erBays: "erBays",
        // Display names from BedManagement component
        General: "generalBeds",
        general: "generalBeds",
        ICU: "icuBeds",
        icu: "icuBeds",
        OT: "otTheatres",
        ot: "otTheatres",
        ER: "erBays",
        er: "erBays",
      };

      const schemaKey = resourceKeyMap[resourceType];

      if (!schemaKey || !hospital.resources[schemaKey]) {
        return res.status(400).json({
          msg: `Invalid resource type "${resourceType}". Valid types: generalBeds, icuBeds, otTheatres, erBays, General, ICU, OT, ER`,
        });
      }

      // Update the available count
      const newAvailable = parseInt(available, 10);
      if (isNaN(newAvailable) || newAvailable < 0) {
        return res
          .status(400)
          .json({ msg: "available must be a non-negative number" });
      }

      hospital.resources[schemaKey].available = Math.min(
        newAvailable,
        hospital.resources[schemaKey].total,
      );

      // If total was also sent (from BedManagement), update it too
      if (req.body.total != null) {
        const newTotal = parseInt(req.body.total, 10);
        if (!isNaN(newTotal) && newTotal >= 0) {
          hospital.resources[schemaKey].total = newTotal;
          // Ensure available doesn't exceed total
          hospital.resources[schemaKey].available = Math.min(
            hospital.resources[schemaKey].available,
            newTotal,
          );
        }
      }

      await hospital.save();

      // Emit socket event — targeted to this hospital's room
      const io = req.app.get("io");
      if (io) {
        io.to(hospital._id.toString()).emit("hospital:bed_update", {
          hospitalId: hospital._id,
          resources: hospital.resources,
        });
      }

      res.json({ resources: hospital.resources });
    } catch (err) {
      console.error("hospital PUT /availability error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// PUT /api/hospital/allocate
//
// Allocates a resource (ICU bed, OT theatre, or ER bay) for a specific case.
// Body: { type: "ICU" | "OT" | "ER", caseId: "<id>" }
router.put(
  "/allocate",
  verifyToken,
  verifyRole("hospital", "admin"),
  async (req, res) => {
    try {
      const { type, caseId } = req.body;

      if (!type || !caseId) {
        return res.status(400).json({ msg: "type and caseId are required" });
      }

      const hospital = await findUserHospital(req.user);
      if (!hospital) {
        return res
          .status(404)
          .json({ msg: "Hospital not found for this user" });
      }

      // Map type to resource schema key
      const typeMap = {
        ICU: "icuBeds",
        OT: "otTheatres",
        ER: "erBays",
        icu: "icuBeds",
        ot: "otTheatres",
        er: "erBays",
      };

      const resourceKey = typeMap[type];
      if (!resourceKey) {
        return res
          .status(400)
          .json({ msg: "Invalid allocation type. Must be ICU, OT, or ER" });
      }

      if (
        !hospital.resources[resourceKey] ||
        hospital.resources[resourceKey].available <= 0
      ) {
        return res
          .status(400)
          .json({ msg: `No ${type} resources available for allocation` });
      }

      // Decrement available count
      hospital.resources[resourceKey].available -= 1;
      await hospital.save();

      // Update the case timeline
      let caseObj = await Case.findById(caseId);
      if (!caseObj) {
        caseObj = await Case.findOne({ caseId: caseId });
      }

      if (caseObj) {
        caseObj.timeline.push({
          event: `${type} reserved by hospital`,
          timestamp: new Date(),
        });
        await caseObj.save();
      }

      // Emit targeted socket event
      const io = req.app.get("io");
      if (io) {
        io.to(hospital._id.toString()).emit("hospital:resource_allocated", {
          type,
          caseId,
          resources: hospital.resources,
        });
      }

      res.json({
        allocated: true,
        type,
        resources: hospital.resources,
      });
    } catch (err) {
      if (err.kind === "ObjectId" || err.name === "CastError") {
        return res.status(400).json({ msg: "Invalid caseId format" });
      }
      console.error("hospital PUT /allocate error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// POST /api/hospital/alert-er
//
// Sends an ER alert to the hospital staff for a specific case.
// Body: { caseId: "<id>" }
router.post(
  "/alert-er",
  verifyToken,
  verifyRole("hospital", "admin"),
  async (req, res) => {
    try {
      const { caseId } = req.body;

      if (!caseId) {
        return res.status(400).json({ msg: "caseId is required" });
      }

      const hospital = await findUserHospital(req.user);

      if (!hospital) {
        return res
          .status(404)
          .json({ msg: "Hospital not found for this user" });
      }

      // Emit to the hospital's room only — never fall back to a global room
      const io = req.app.get("io");
      if (io) {
        io.to(hospital._id.toString()).emit("er:alert", { caseId });
      }

      res.json({ alerted: true });
    } catch (err) {
      console.error("hospital POST /alert-er error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// POST /api/hospital/report-disease
//
// Hospital staff can report a disease trend for admin review.
// Body: { diseaseName, caseCount, severity: 'high'|'medium'|'low', notes }
// Creates an Alert document with active: false (pending admin approval).
router.post(
  "/report-disease",
  verifyToken,
  verifyRole("hospital", "admin"),
  async (req, res) => {
    try {
      const { diseaseName, caseCount, severity, notes } = req.body;

      if (!diseaseName || caseCount == null || !severity) {
        return res
          .status(400)
          .json({ msg: "diseaseName, caseCount, and severity are required" });
      }

      const allowedSeverities = ["high", "medium", "low"];
      if (!allowedSeverities.includes(severity)) {
        return res
          .status(400)
          .json({ msg: "severity must be one of: high, medium, low" });
      }

      const hospital = await findUserHospital(req.user);

      const alert = new Alert({
        type: "disease",
        title: `${diseaseName} Outbreak Report`,
        message: notes || `${caseCount} cases of ${diseaseName} reported.`,
        severity,
        diseaseName,
        caseCount: parseInt(caseCount, 10),
        reportedBy: hospital ? hospital._id : undefined,
        city:
          hospital && hospital.location
            ? hospital.location.city || hospital.location.address
            : undefined,
        active: false, // Inactive until admin approves
      });

      await alert.save();

      res.status(201).json({
        alertId: alert._id,
        status: "pending_review",
      });
    } catch (err) {
      console.error("hospital POST /report-disease error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

module.exports = router;
