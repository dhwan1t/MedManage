const router = require("express").Router();
const Ambulance = require("../models/Ambulance");
const Case = require("../models/Case");
const { verifyToken, verifyRole } = require("../middleware/auth");

/**
 * Map display-friendly status strings from the client to the Mongoose enum values.
 * Client sends: "AVAILABLE", "ON CALL", "OFF DUTY"
 * Model expects: "available", "on_call", "off_duty"
 */
function normalizeStatus(input) {
  if (!input) return null;
  const map = {
    AVAILABLE: "available",
    "ON CALL": "on_call",
    "OFF DUTY": "off_duty",
    available: "available",
    on_call: "on_call",
    off_duty: "off_duty",
  };
  return map[input] || input.toLowerCase().replace(/\s+/g, "_");
}

// PUT /api/ambulance/status
router.put(
  "/status",
  verifyToken,
  verifyRole("ambulance", "admin"),
  async (req, res) => {
    try {
      const rawStatus = req.body.status;
      const status = normalizeStatus(rawStatus);

      if (!status || !["available", "on_call", "off_duty"].includes(status)) {
        return res.status(400).json({
          msg: `Invalid status "${rawStatus}". Must be one of: available, on_call, off_duty (or AVAILABLE, ON CALL, OFF DUTY)`,
        });
      }

      // Find the ambulance linked to this user.
      // First try by operatorId (the proper link), then fallback to user.ambulanceId from JWT.
      let ambulance = await Ambulance.findOne({
        operatorId: req.user.userId,
      });

      if (!ambulance && req.user.ambulanceId) {
        ambulance = await Ambulance.findById(req.user.ambulanceId);
      }

      if (!ambulance) {
        return res
          .status(404)
          .json({ msg: "No ambulance found for this user" });
      }

      // If switching away from on_call, clear the assigned case
      if (status !== "on_call" && ambulance.status === "on_call") {
        ambulance.assignedCase = null;
      }

      ambulance.status = status;
      await ambulance.save();

      res.json({
        status: ambulance.status,
        ambulanceId: ambulance.ambulanceId,
      });
    } catch (err) {
      console.error("ambulance PUT /status error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// GET /api/ambulance/active-case
router.get(
  "/active-case",
  verifyToken,
  verifyRole("ambulance", "admin"),
  async (req, res) => {
    try {
      let ambulance = await Ambulance.findOne({
        operatorId: req.user.userId,
      });

      if (!ambulance && req.user.ambulanceId) {
        ambulance = await Ambulance.findById(req.user.ambulanceId);
      }

      if (!ambulance) {
        return res
          .status(404)
          .json({ msg: "No ambulance found for this user" });
      }

      if (!ambulance.assignedCase) {
        return res
          .status(200)
          .json({ msg: "No active case assigned", activeCase: null });
      }

      // Fetch the full case details with populated patient
      const activeCase = await Case.findById(ambulance.assignedCase).populate(
        "patient",
      );

      if (!activeCase) {
        // Case was deleted or completed — clean up the reference
        ambulance.assignedCase = null;
        await ambulance.save();
        return res
          .status(200)
          .json({ msg: "No active case assigned", activeCase: null });
      }

      res.json({
        activeCase,
        ambulanceId: ambulance.ambulanceId,
        status: ambulance.status,
      });
    } catch (err) {
      console.error("ambulance GET /active-case error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

// PUT /api/ambulance/location — Update ambulance GPS coordinates
router.put(
  "/location",
  verifyToken,
  verifyRole("ambulance", "admin"),
  async (req, res) => {
    try {
      const { lat, lng } = req.body;

      if (lat == null || lng == null) {
        return res.status(400).json({ msg: "lat and lng are required" });
      }

      let ambulance = await Ambulance.findOne({
        operatorId: req.user.userId,
      });

      if (!ambulance && req.user.ambulanceId) {
        ambulance = await Ambulance.findById(req.user.ambulanceId);
      }

      if (!ambulance) {
        return res
          .status(404)
          .json({ msg: "No ambulance found for this user" });
      }

      ambulance.currentLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      };
      await ambulance.save();

      // Emit location update for live map
      const io = req.app.get("io");
      if (io) {
        io.emit("ambulance:location_update", {
          ambulanceId: ambulance.ambulanceId,
          lat: ambulance.currentLocation.lat,
          lng: ambulance.currentLocation.lng,
          status: ambulance.status,
        });
      }

      res.json({ location: ambulance.currentLocation });
    } catch (err) {
      console.error("ambulance PUT /location error:", err.message);
      res.status(500).json({ msg: "Server error" });
    }
  },
);

module.exports = router;
