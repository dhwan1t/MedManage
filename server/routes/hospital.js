const router = require('express').Router();
const Hospital = require('../models/Hospital');

router.get('/', async (req, res) => {
    try {
        const hospitals = await Hospital.find();
        res.json(hospitals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/:id/beds', async (req, res) => {
    try {
        const { availableBeds } = req.body;
        let hospital = await Hospital.findById(req.params.id);
        if (!hospital) return res.status(404).json({ msg: 'Hospital not found' });

        hospital.availableBeds = availableBeds;
        await hospital.save();
        res.json(hospital);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
