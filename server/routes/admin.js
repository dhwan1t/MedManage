const router = require('express').Router();
const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');
const Case = require('../models/Case');
const { verifyToken, verifyRole } = require('../middleware/auth');

// GET /api/admin/dashboard?city=Ludhiana
router.get('/dashboard', verifyToken, verifyRole('admin'), async (req, res) => {
    try {
        const { city } = req.query;

        const hospitalQuery = city ? { 'location.address': new RegExp(city, 'i') } : {};

        const hospitals = await Hospital.find(hospitalQuery);
        const ambulances = await Ambulance.find();

        // Get today's start and end date
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const casesToday = await Case.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const stats = {
            activeAmbulances: ambulances.filter(a => a.status === 'on_call' || a.status === 'available').length,
            totalBedsAvailable: hospitals.reduce((acc, curr) => acc + curr.resources.generalBeds.available, 0)
        };

        res.json({
            hospitals,
            ambulances,
            casesToday,
            stats
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// GET /api/admin/analytics
router.get('/analytics', verifyToken, verifyRole('admin'), (req, res) => {
    // Hardcoded mockup data for hackathon
    const analyticsData = {
        weeklyCases: [120, 150, 180, 130, 200, 210, 160],
        responseTimesAvg: [12, 11, 14, 9, 10, 8, 11], // in minutes
        topHospitals: [
            { name: 'City Hospital', casesHandled: 450 },
            { name: 'Trust Care', casesHandled: 320 },
            { name: 'Metro Life', casesHandled: 280 }
        ],
        severityDistribution: {
            high: 30,
            medium: 50,
            low: 20
        }
    };

    res.json(analyticsData);
});

module.exports = router;
