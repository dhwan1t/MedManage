const router = require('express').Router();
const Ambulance = require('../models/Ambulance');
const Case = require('../models/Case');
const { verifyToken, verifyRole } = require('../middleware/auth');

// PUT /api/ambulance/status
router.put('/status', verifyToken, verifyRole('ambulance'), async (req, res) => {
    try {
        const { status } = req.body;

        // Assuming the req.user has an ambulance document associated with user's ID
        const ambulance = await Ambulance.findOne({ operatorId: req.user.userId });

        if (!ambulance) {
            return res.status(404).json({ msg: 'Ambulance not found for this user' });
        }

        ambulance.status = status;
        await ambulance.save();

        res.json({ status: ambulance.status });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// GET /api/ambulance/active-case
router.get('/active-case', verifyToken, verifyRole('ambulance'), async (req, res) => {
    try {
        const ambulance = await Ambulance.findOne({ operatorId: req.user.userId }).populate('assignedCase');

        if (!ambulance) {
            return res.status(404).json({ msg: 'Ambulance not found for this user' });
        }

        if (!ambulance.assignedCase) {
            return res.status(200).json({ msg: 'No active case assigned', activeCase: null });
        }

        // Fetch the full case details
        const activeCase = await Case.findById(ambulance.assignedCase).populate('patient');

        res.json(activeCase);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
