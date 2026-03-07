const { calculateSeverity } = require('./severityAggregator');
const { rankHospitals } = require('./hospitalRanker');

// Test case 1: Critical patient
const criticalVitals = {
    heartRate: 125, systolic: 85, diastolic: 55,
    respiratoryRate: 28, temperature: 38.8,
    oxygenSat: 88, consciousness: 'Pain',
    age: 62, conditions: ['Heart Disease', 'Diabetes']
};

// Test case 2: Stable patient
const stableVitals = {
    heartRate: 78, systolic: 118, diastolic: 75,
    respiratoryRate: 16, temperature: 37.1,
    oxygenSat: 98, consciousness: 'Alert',
    age: 35, conditions: []
};

const s1 = calculateSeverity(criticalVitals);
const s2 = calculateSeverity(stableVitals);

console.log('CRITICAL:', JSON.stringify(s1, null, 2));
console.log('STABLE:', JSON.stringify(s2, null, 2));
console.assert(s1.score > s2.score, 'Critical must score higher than stable');
console.assert(s1.level === 'critical', 'Must be critical');
console.assert(!s1.canWait, 'Critical cannot wait');
console.assert(s2.canWait, 'Stable can wait');
console.log('All tests passed ✓');
