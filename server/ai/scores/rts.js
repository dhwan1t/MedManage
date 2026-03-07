/**
 * Calculates Revised Trauma Score (RTS) for trauma cases.
 * RTS = 0.9368 * GCS_coded + 0.7326 * SBP_coded + 0.2908 * RR_coded
 * 
 * @param {Object} params 
 * @param {number} params.gcsScore - Glasgow Coma Scale (3-15)
 * @param {number} params.systolic - Systolic Blood Pressure (mmHg)
 * @param {number} params.respiratoryRate - Respiratory Rate (breaths/min)
 * @returns {Object} { score: number, survivalProbability: number, flag: boolean }
 */
function calculateRTS({ gcsScore, systolic, respiratoryRate }) {
    let gcsCoded = 0;
    if (gcsScore >= 13 && gcsScore <= 15) gcsCoded = 4;
    else if (gcsScore >= 9 && gcsScore <= 12) gcsCoded = 3;
    else if (gcsScore >= 6 && gcsScore <= 8) gcsCoded = 2;
    else if (gcsScore >= 4 && gcsScore <= 5) gcsCoded = 1;
    else if (gcsScore === 3) gcsCoded = 0;

    let sbpCoded = 0;
    if (systolic > 89) sbpCoded = 4;
    else if (systolic >= 76 && systolic <= 89) sbpCoded = 3;
    else if (systolic >= 50 && systolic <= 75) sbpCoded = 2;
    else if (systolic >= 1 && systolic <= 49) sbpCoded = 1;
    else if (systolic === 0) sbpCoded = 0;

    let rrCoded = 0;
    if (respiratoryRate >= 10 && respiratoryRate <= 29) rrCoded = 4;
    else if (respiratoryRate > 29) rrCoded = 3;
    else if (respiratoryRate >= 6 && respiratoryRate <= 9) rrCoded = 2;
    else if (respiratoryRate >= 1 && respiratoryRate <= 5) rrCoded = 1;
    else if (respiratoryRate === 0) rrCoded = 0;

    const rts = (0.9368 * gcsCoded) + (0.7326 * sbpCoded) + (0.2908 * rrCoded);

    // Survival probability: roughly Ps = 1 / (1 + e^(-b)) where b = -3.5718 + RTS * 0.847
    const b = -3.5718 + (rts * 0.847);
    // Ensure valid calculation if input was null/undefined resulting in NaN
    const survivalProb = isNaN(b) ? 0 : Math.round(100 / (1 + Math.exp(-b)));

    return {
        score: parseFloat(rts.toFixed(2)),
        survivalProbability: survivalProb, // 0-100%
        flag: rts < 4 // RTS < 4 indicates critical trauma
    };
}

module.exports = { calculateRTS };