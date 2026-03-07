const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    vitals: {
        heartRate: { type: Number },
        bp: { type: String },
        oxygenLevel: { type: Number }
    },
    condition: { type: String },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' }
});

module.exports = mongoose.model('Patient', patientSchema);
