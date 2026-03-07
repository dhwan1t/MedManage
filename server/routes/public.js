const router = require("express").Router();
const Alert = require("../models/Alert");
const Ambulance = require("../models/Ambulance");
const Case = require("../models/Case");
const Patient = require("../models/Patient");
const { getDistance } = require("../utils/geo");

// GET /api/public/disease-alerts?city=Ludhiana
router.get("/disease-alerts", async (req, res) => {
  try {
    const { city } = req.query;
    const filter = { active: true };
    if (city) {
      filter.city = new RegExp(city, "i");
    }

    const alerts = await Alert.find(filter);

    // Custom sort: high -> medium -> low
    const severityMap = { high: 1, medium: 2, low: 3 };
    alerts.sort(
      (a, b) =>
        (severityMap[a.severity] || 99) - (severityMap[b.severity] || 99),
    );

    res.json(alerts);
  } catch (err) {
    console.error("disease-alerts error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/public/request-ambulance
//
// P1-08: Uses findOneAndUpdate with an atomic status flip from "available"
//        to "on_call" to prevent the race condition where two concurrent
//        requests could grab the same ambulance.
// P2-01: Uses shared getDistance from utils/geo instead of a local copy.
router.post("/request-ambulance", async (req, res) => {
  try {
    // Accept both `name` and `fullName` from the client for compatibility
    const { name, fullName, phone, location, emergencyType, notes } = req.body;

    const patientName = (name || fullName || "").trim();
    if (!patientName) {
      return res.status(400).json({ msg: "Patient name is required" });
    }

    // ── Determine patient coordinates ──
    let patientLat = null;
    let patientLng = null;

    if (
      location &&
      typeof location === "object" &&
      location.lat &&
      location.lng
    ) {
      patientLat = parseFloat(location.lat);
      patientLng = parseFloat(location.lng);
    }

    // ── Find and atomically claim the nearest available ambulance ──
    // P1-08 FIX: Instead of find() then save(), we use findOneAndUpdate
    // with { status: "available" } as a precondition. This guarantees that
    // two concurrent requests cannot both claim the same ambulance, because
    // only one findOneAndUpdate will match the "available" status — the
    // loser's query simply returns null and we try the next candidate.

    let ambulance = null;
    let claimedDistance = null;

    if (patientLat != null && patientLng != null) {
      // Get all available ambulances, sort by distance, then try to
      // atomically claim starting from the closest one.
      const availableAmbulances = await Ambulance.find({ status: "available" });

      if (!availableAmbulances.length) {
        return res
          .status(404)
          .json({ msg: "No ambulances available at the moment" });
      }

      const withDistance = availableAmbulances.map((a) => {
        const aLat =
          a.currentLocation && a.currentLocation.lat
            ? a.currentLocation.lat
            : 0;
        const aLng =
          a.currentLocation && a.currentLocation.lng
            ? a.currentLocation.lng
            : 0;
        return {
          ambulanceId: a._id,
          distance: getDistance(patientLat, patientLng, aLat, aLng),
        };
      });
      withDistance.sort((a, b) => a.distance - b.distance);

      // Try to atomically claim each ambulance starting from the closest
      for (const candidate of withDistance) {
        const claimed = await Ambulance.findOneAndUpdate(
          { _id: candidate.ambulanceId, status: "available" },
          { $set: { status: "on_call" } },
          { new: true },
        );
        if (claimed) {
          ambulance = claimed;
          claimedDistance = candidate.distance;
          break;
        }
        // If claimed is null, another request grabbed it first — try the next one
      }
    } else {
      // No coordinates — atomically grab any available ambulance
      ambulance = await Ambulance.findOneAndUpdate(
        { status: "available" },
        { $set: { status: "on_call" } },
        { new: true },
      );
    }

    if (!ambulance) {
      return res
        .status(404)
        .json({ msg: "No ambulances available at the moment" });
    }

    // ── Create Patient ──
    const newPatient = new Patient({
      name: patientName,
      vitals: {
        chiefComplaint: emergencyType || "Unknown",
      },
    });

    // ── Create Case ──
    const newCase = new Case({
      patient: newPatient._id,
      ambulance: ambulance._id,
      status: "dispatched",
      timeline: [{ event: "ambulance assigned", timestamp: new Date() }],
    });

    newPatient.caseId = newCase._id;
    await newPatient.save();

    // Link ambulance to case
    ambulance.assignedCase = newCase._id;
    await ambulance.save();

    const savedCase = await newCase.save();

    // ── Calculate rough ETA (km * 2.5 min + 2 min base) ──
    let etaMinutes = 8; // default when coords are unknown
    if (claimedDistance != null) {
      etaMinutes = Math.max(2, Math.round(claimedDistance * 2.5 + 2));
    } else if (
      patientLat != null &&
      patientLng != null &&
      ambulance.currentLocation
    ) {
      const dist = getDistance(
        patientLat,
        patientLng,
        ambulance.currentLocation.lat || 0,
        ambulance.currentLocation.lng || 0,
      );
      etaMinutes = Math.max(2, Math.round(dist * 2.5 + 2));
    }

    // ── Emit socket event ──
    const io = req.app.get("io");
    if (io) {
      // Emit to admin room for dashboard visibility
      io.to("admin").emit("case:assigned", {
        caseId: savedCase.caseId,
        caseObjectId: savedCase._id,
        ambulanceId: ambulance.ambulanceId,
        eta: etaMinutes,
      });

      // Emit to the specific ambulance's room
      if (ambulance._id) {
        io.to(ambulance._id.toString()).emit("case:assigned", {
          caseId: savedCase.caseId,
          caseObjectId: savedCase._id,
          ambulanceId: ambulance.ambulanceId,
          eta: etaMinutes,
        });
      }
    }

    res.status(201).json({
      caseId: savedCase.caseId,
      caseObjectId: savedCase._id,
      ambulanceId: ambulance.ambulanceId,
      eta: etaMinutes,
    });
  } catch (err) {
    console.error("request-ambulance error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
