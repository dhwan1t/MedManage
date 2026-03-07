const router = require('express').Router();
const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');
const Case = require('../models/Case');

router.get('/stats', async (req, res) => {
    try {
        const totalHospitals = await Hospital.countDocuments();
        const totalAmbulances = await Ambulance.countDocuments();
        const activeCases = await Case.countDocuments({ status: { $in: ['pending', 'assigned', 'en_route'] } });

        res.json({
            totalHospitals,
            totalAmbulances,
            activeCases
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
