const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
    vehicleNumber: { type: String, required: true, unique: true },
    driverName: { type: String, required: true },
    currentLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },
    status: {
        type: String,
        enum: ['available', 'busy', 'offline'],
        default: 'offline'
    },
    assignedCase: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
    equipment: [{ type: String }]
});

ambulanceSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
