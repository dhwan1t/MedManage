const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["disease", "emergency", "system"],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ["high", "medium", "low"], required: true },
  affectedZones: [{ type: String }],
  city: { type: String },
  active: { type: Boolean, default: true },
  symptoms: [{ type: String }],
  diseaseName: { type: String },
  caseCount: { type: Number },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Alert", alertSchema);
