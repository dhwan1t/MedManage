const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    vitals: {
        heartRate: { type: Number },
        systolic: { type: Number },
        diastolic: { type: Number },
        respiratoryRate: { type: Number },
        temperature: { type: Number },
        oxygenSat: { type: Number },
        consciousness: { type: String },
        chiefComplaint: { type: String },
        age: { type: Number },
        conditions: [{ type: String }]
    },
    severity: {
        score: { type: Number },
        level: { type: String },
        canWait: { type: Boolean },
        flags: [{ type: String }]
    },
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    status: { type: String, enum: ['incoming', 'arrived', 'admitted', 'discharged'], default: 'incoming' },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);
