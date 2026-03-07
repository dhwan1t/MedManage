const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['public', 'ambulance', 'hospital', 'admin'], required: true },
    phone: { type: String },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    ambulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
