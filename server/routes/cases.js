const router = require('express').Router();
const Case = require('../models/Case');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const { verifyToken } = require('../middleware/auth');
const { calculateSeverity } = require('../ai/severityAggregator');
const { rankHospitals } = require('../ai/hospitalRanker');

// POST /api/cases/create
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { ambulanceId, patientName, emergencyType, location } = req.body;

        // Create new Patient
        const newPatient = new Patient({
            name: patientName,
            vitals: { chiefComplaint: emergencyType }
        });

        // Create new Case
        const newCase = new Case({
            patient: newPatient._id,
            ambulance: ambulanceId,
            status: 'dispatched',
            timeline: [{ event: 'dispatched', timestamp: new Date() }]
        });

        // Link Case to Patient
        newPatient.caseId = newCase._id;

        await newPatient.save();
        const savedCase = await newCase.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('case:created', savedCase);
        }

        res.status(201).json({ caseId: savedCase.caseId, status: savedCase.status });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// PUT /api/cases/:id/update-vitals
router.put('/:id/update-vitals', verifyToken, async (req, res) => {
    try {
        const vitals = req.body;
        const caseObj = await Case.findById(req.params.id);

        if (!caseObj) return res.status(404).json({ msg: 'Case not found' });

        const patientObj = await Patient.findById(caseObj.patient);
        if (!patientObj) return res.status(404).json({ msg: 'Patient not found' });

        // Update vitals
        patientObj.vitals = { ...patientObj.vitals, ...vitals };

        // Calculate severity using AI Engine
        const severity = calculateSeverity(patientObj.vitals);
        patientObj.severity = severity;

        await patientObj.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('patient:vitals_update', { caseId: caseObj.caseId, severity: patientObj.severity });
        }

        res.json({ severity: patientObj.severity });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// GET /api/cases/:id/recommendation
router.get('/:id/recommendation', verifyToken, async (req, res) => {
    try {
        const caseObj = await Case.findById(req.params.id);
        if (!caseObj) return res.status(404).json({ msg: 'Case not found' });

        const patientObj = await Patient.findById(caseObj.patient);
        if (!patientObj) return res.status(404).json({ msg: 'Patient not found' });

        const hospitals = await Hospital.find({ status: 'accepting' });

        // Pass severity, vitals, and all hospitals to the AI Ranker
        const rankedHospitals = rankHospitals(patientObj.severity, patientObj.vitals, hospitals);

        caseObj.aiRecommendations = rankedHospitals;
        await caseObj.save();

        res.json({ severity: patientObj.severity, recommendations: rankedHospitals });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// PUT /api/cases/:id/select-hospital
router.put('/:id/select-hospital', verifyToken, async (req, res) => {
    try {
        const { hospitalId } = req.body;
        const caseObj = await Case.findById(req.params.id);

        if (!caseObj) return res.status(404).json({ msg: 'Case not found' });

        const patientObj = await Patient.findById(caseObj.patient);

        caseObj.selectedHospital = hospitalId;
        caseObj.status = 'en_route';
        caseObj.timeline.push({ event: 'en_route', timestamp: new Date() });

        await caseObj.save();

        // Emit to specific hospital's room
        const io = req.app.get('io');
        if (io) {
            io.to(hospitalId.toString()).emit('ambulance:dispatch', {
                case: caseObj,
                patient: patientObj,
                eta: 420 // Hardcoded ETA for mockup
            });
        }

        res.json({ status: caseObj.status });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// PUT /api/cases/:id/status
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const caseObj = await Case.findById(req.params.id);

        if (!caseObj) return res.status(404).json({ msg: 'Case not found' });

        caseObj.status = status;
        caseObj.timeline.push({ event: status, timestamp: new Date() });

        await caseObj.save();

        const io = req.app.get('io');
        if (io && status === 'arrived') {
            io.emit('case:arrived', { caseId: caseObj.caseId });
        }

        res.json({ status: caseObj.status });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
