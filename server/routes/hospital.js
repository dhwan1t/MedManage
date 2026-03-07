const router = require('express').Router();
const Hospital = require('../models/Hospital');
const Case = require('../models/Case');
const { verifyToken, verifyRole } = require('../middleware/auth');

// PUT /api/hospital/availability
router.put('/availability', verifyToken, verifyRole('hospital'), async (req, res) => {
    try {
        const { resourceType, available } = req.body;

        // Find the hospital associated with this user
        // (Assuming User schema has hospitalId or we query by user ref)
        const user = req.user;
        // In a real app we need `hospitalId` in JWT or lookup User
        // For simplicity, find the first hospital or assume one is linked directly
        const hospital = await Hospital.findOne(); // Mocking actual association for now

        if (!hospital) {
            return res.status(404).json({ msg: 'Hospital not found' });
        }

        if (hospital.resources[resourceType]) {
            hospital.resources[resourceType].available = available;
            await hospital.save();

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.emit('hospital:bed_update', hospital.resources);
            }

            res.json({ resources: hospital.resources });
        } else {
            res.status(400).json({ msg: 'Invalid resource type' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// PUT /api/hospital/allocate
router.put('/allocate', verifyToken, verifyRole('hospital'), async (req, res) => {
    try {
        const { type, caseId } = req.body;

        const hospital = await Hospital.findOne(); // Mocking association
        if (!hospital) return res.status(404).json({ msg: 'Hospital not found' });

        let resourceKey;
        if (type === 'ICU') resourceKey = 'icuBeds';
        else if (type === 'OT') resourceKey = 'otTheatres';
        else if (type === 'ER') resourceKey = 'erBays';
        else return res.status(400).json({ msg: 'Invalid allocation type' });

        if (hospital.resources[resourceKey] && hospital.resources[resourceKey].available > 0) {
            hospital.resources[resourceKey].available -= 1;
            await hospital.save();

            const caseObj = await Case.findById(caseId);
            if (caseObj) {
                caseObj.timeline.push({ event: `${type} reserved by hospital`, timestamp: new Date() });
                await caseObj.save();
            }

            res.json({ allocated: true });
        } else {
            res.status(400).json({ msg: 'No resources available for allocation' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// POST /api/hospital/alert-er
router.post('/alert-er', verifyToken, verifyRole('hospital'), async (req, res) => {
    try {
        const { caseId } = req.body;

        // Emit to hospital staff
        const io = req.app.get('io');
        if (io) {
            // In a real app, this would be an ER specific room, or general hospital room
            io.emit('er:alert', { caseId });
        }

        res.json({ alerted: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
