const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["govt", "private", "trust"], required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
  },
  resources: {
    generalBeds: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    icuBeds: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    otTheatres: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    erBays: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
  },
  doctors: [
    {
      name: { type: String },
      speciality: { type: String },
      available: { type: Boolean, default: true },
    },
  ],
  status: {
    type: String,
    enum: ["accepting", "at_capacity", "emergency_only"],
    default: "accepting",
  },
  rating: { type: Number },
  totalCases: { type: Number, default: 0 },
  avgResponseTime: { type: Number },
  webhookUrl: { type: String, default: null },
  webhookEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Hospital", hospitalSchema);
