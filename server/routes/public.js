const router = require('express').Router();
const Alert = require('../models/Alert');
const Ambulance = require('../models/Ambulance');
const Case = require('../models/Case');
const Patient = require('../models/Patient');

// GET /api/public/disease-alerts?city=Ludhiana
router.get('/disease-alerts', async (req, res) => {
    try {
        const { city } = req.query;
        const filter = { active: true };
        if (city) {
            filter.city = city;
        }

        // Custom sort: high -> medium -> low
        const severityMap = { 'high': 1, 'medium': 2, 'low': 3 };
        const alerts = await Alert.find(filter);

        alerts.sort((a, b) => severityMap[a.severity] - severityMap[b.severity]);

        res.json(alerts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// POST /api/public/request-ambulance
router.post('/request-ambulance', async (req, res) => {
    try {
        const { name, phone, location, emergencyType, notes } = req.body;

        // Find nearest available ambulance (mock: just find first 'available')
        let ambulance = await Ambulance.findOne({ status: 'available' });

        if (!ambulance) {
            return res.status(404).json({ msg: 'No ambulances available at the moment' });
        }

        // Update ambulance status
        ambulance.status = 'on_call';
        await ambulance.save();

        // Create a new Patient
        const newPatient = new Patient({
            name,
            vitals: { chiefComplaint: emergencyType }
        });

        // Create a Case
        const newCase = new Case({
            patient: newPatient._id,
            ambulance: ambulance._id,
            status: 'dispatched',
            timeline: [{ event: 'ambulance assigned', timestamp: new Date() }]
        });

        newPatient.caseId = newCase._id;
        await newPatient.save();

        // Update ambulance's assigned case
        ambulance.assignedCase = newCase._id;
        await ambulance.save();

        const savedCase = await newCase.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('case:assigned', { case: savedCase, ambulanceId: ambulance.ambulanceId });
        }

        res.status(201).json({
            caseId: savedCase.caseId,
            ambulanceId: ambulance.ambulanceId,
            eta: 8 // Mock ETA in minutes
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
