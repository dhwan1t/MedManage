const router = require('express').Router();
const Ambulance = require('../models/Ambulance');

router.get('/', async (req, res) => {
    try {
        const ambulances = await Ambulance.find();
        res.json(ambulances);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const ambulance = await Ambulance.findById(req.params.id);
        if (!ambulance) return res.status(404).json({ msg: 'Ambulance not found' });
        res.json(ambulance);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Ambulance not found' });
        res.status(500).send('Server error');
    }
});

router.put('/:id/location', async (req, res) => {
    try {
        const { coordinates } = req.body;
        let ambulance = await Ambulance.findById(req.params.id);
        if (!ambulance) return res.status(404).json({ msg: 'Ambulance not found' });

        ambulance.currentLocation.coordinates = coordinates;
        await ambulance.save();
        res.json(ambulance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
