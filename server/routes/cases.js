const router = require('express').Router();
const Case = require('../models/Case');
const Patient = require('../models/Patient');
const { calculateSeverity } = require('../ai/severityAggregator');
const { rankHospitals } = require('../ai/hospitalRanker');

router.post('/', async (req, res) => {
    try {
        const { patientId, ambulanceId, hospitalId } = req.body;

        // Example: Fetch patient vitals here to pass to AI if needed
        const patient = await Patient.findById(patientId);
        let severityLevel = 'unknown';
        let recommendations = {};

        if (patient && patient.vitals) {
            const aiResult = calculateSeverity(patient.vitals);
            severityLevel = aiResult.level;
        }

        const newCase = new Case({
            patientId,
            ambulanceId,
            hospitalId,
            severityLevel,
            mlRecommendation: recommendations,
            status: 'pending'
        });

        const savedCase = await newCase.save();
        res.json(savedCase);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/', async (req, res) => {
    try {
        const cases = await Case.find().populate('patientId').populate('ambulanceId').populate('hospitalId');
        res.json(cases);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id).populate('patientId').populate('ambulanceId').populate('hospitalId');
        if (!caseItem) return res.status(404).json({ msg: 'Case not found' });
        res.json(caseItem);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Case not found' });
        res.status(500).send('Server error');
    }
});

router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        let caseItem = await Case.findById(req.params.id);
        if (!caseItem) return res.status(404).json({ msg: 'Case not found' });

        caseItem.status = status;
        await caseItem.save();
        res.json(caseItem);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/:id/recommend-hospitals', async (req, res) => {
    try {
        const caseItem = await Case.findById(req.params.id).populate('patientId');
        if (!caseItem) return res.status(404).json({ msg: 'Case not found' });

        // Assuming we have ambulance location
        // Here we'd fetch all hospitals and pass to rankHospitals
        const rankedHospitals = rankHospitals(); // Placeholder, P4 provides actual logic

        caseItem.mlRecommendation = rankedHospitals;
        await caseItem.save();

        res.json(rankedHospitals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
