const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    ambulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'en_route', 'completed'],
        default: 'pending'
    },
    severityLevel: { type: String },
    mlRecommendation: { type: mongoose.Schema.Types.Mixed }, // JSON for AI recs
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Case', caseSchema);
