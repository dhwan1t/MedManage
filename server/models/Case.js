const mongoose = require("mongoose");
const crypto = require("crypto");

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    default: () => "CASE-" + crypto.randomUUID().split("-")[0].toUpperCase(),
    unique: true,
  },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  ambulance: { type: mongoose.Schema.Types.ObjectId, ref: "Ambulance" },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  status: {
    type: String,
    enum: ["dispatched", "en_route", "arrived", "completed"],
    default: "dispatched",
  },
  timeline: [
    {
      event: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  aiRecommendations: [
    {
      hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
      score: { type: Number },
      reason: { type: String },
      distance: { type: Number },
    },
  ],
  selectedHospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  estimatedEta: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Case", caseSchema);
