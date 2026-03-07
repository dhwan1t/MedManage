const { calculateMEWS } = require('./scores/mews');
const { calculateShockIndex } = require('./scores/shockIndex');
const { calculateRTS } = require('./scores/rts');
const { calculateSimplifiedSOFA } = require('./scores/sofa');
const { deriveGCSFromAVPU } = require('./scores/gcs');

/**
 * Main AI function called by P3 to aggregate severity.
 * Runs all scoring models and produces a single unified severity object.
 * 
 * @param {Object} vitals 
 * @returns {Object} { score, level, canWait, flags, breakdown, survivalProbability }
 */
function calculateSeverity(vitals) {
    const {
        heartRate, systolic, diastolic, respiratoryRate,
        temperature, oxygenSat, consciousness, age, conditions = []
    } = vitals;

    const gcsScore = deriveGCSFromAVPU(consciousness);
    const mews = calculateMEWS({ heartRate, systolic, respiratoryRate, temperature, consciousness });
    const shock = calculateShockIndex({ heartRate, systolic });
    const rts = calculateRTS({ gcsScore, systolic, respiratoryRate });
    const sofa = calculateSimplifiedSOFA({ oxygenSat, systolic, diastolic, gcsScore });

    const flags = [];
    if (shock.flag) flags.push('shock_risk');
    if (sofa.flag) flags.push('organ_failure_risk');
    if (rts.flag) flags.push('critical_trauma');
    if (gcsScore < 9) flags.push('brain_injury_risk');
    if (oxygenSat < 90) flags.push('respiratory_distress');

    // Condition multipliers
    let multiplier = 1.0;
    if (conditions.includes('Heart Disease') && heartRate > 100) multiplier += 0.15;
    if (conditions.includes('Diabetes') && temperature > 38.5) multiplier += 0.1;
    if (age > 65) multiplier += 0.1;

    // Composite score: 0-100
    // MEWS: max 14 -> normalize. RTS: max 7.84 (lower = worse, invert). SOFA: max 9.
    const mewsNorm = (mews.score / 14) * 100;
    const rtsNorm = ((7.84 - rts.score) / 7.84) * 100;
    const sofaNorm = (sofa.score / 9) * 100;
    const shockNorm = Math.min(shock.score * 50, 100);

    const rawScore = (mewsNorm * 0.3) + (rtsNorm * 0.25) + (sofaNorm * 0.25) + (shockNorm * 0.2);
    const finalScore = Math.min(Math.round(rawScore * multiplier), 100);

    const level = finalScore >= 70 ? 'critical' : finalScore >= 40 ? 'urgent' : 'stable';
    const canWait = finalScore < 60;

    return {
        score: finalScore,
        level,
        canWait,
        flags,
        breakdown: {
            mews: mews.score,
            shockIndex: shock.score,
            rts: rts.score,
            sofa: sofa.score
        },
        survivalProbability: rts.survivalProbability
    };
}

module.exports = { calculateSeverity };