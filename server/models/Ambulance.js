const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
    ambulanceId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['available', 'on_call', 'off_duty'], default: 'off_duty' },
    currentLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    assignedCase: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ambulance', ambulanceSchema);
