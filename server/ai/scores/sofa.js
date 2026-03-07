/**
 * Calculates a simplified SOFA (Sequential Organ Failure Assessment) score.
 * Designed for pre-hospital/ambulance use where full lab values are unavailable.
 * 
 * @param {Object} params 
 * @param {number} params.oxygenSat - Oxygen Saturation (SpO2 %)
 * @param {number} params.systolic - Systolic Blood Pressure (mmHg)
 * @param {number} params.diastolic - Diastolic Blood Pressure (mmHg)
 * @param {number} params.gcsScore - Glasgow Coma Scale (3-15)
 * @returns {Object} { score: number, components: { respiratory, cardiovascular, neurological }, flag: boolean }
 */
function calculateSimplifiedSOFA({ oxygenSat, systolic, diastolic, gcsScore }) {
    let respScore = 0;
    if (oxygenSat != null) {
        if (oxygenSat >= 96) respScore = 0;
        else if (oxygenSat >= 91 && oxygenSat <= 95) respScore = 1;
        else if (oxygenSat >= 86 && oxygenSat <= 90) respScore = 2;
        else if (oxygenSat <= 85) respScore = 3;
    }

    let cardioScore = 0;
    if (systolic != null && diastolic != null) {
        const map = (systolic + 2 * diastolic) / 3;
        if (map >= 70) cardioScore = 0;
        else if (map >= 60 && map < 70) cardioScore = 1;
        else if (map >= 50 && map < 60) cardioScore = 2;
        else if (map < 50) cardioScore = 3;
    }

    let neuroScore = 0;
    if (gcsScore != null) {
        if (gcsScore >= 15) neuroScore = 0;
        else if (gcsScore >= 13 && gcsScore <= 14) neuroScore = 1;
        else if (gcsScore >= 10 && gcsScore <= 12) neuroScore = 2;
        else if (gcsScore < 10) neuroScore = 3;
    }

    const total = respScore + cardioScore + neuroScore;

    return {
        score: total,
        components: {
            respiratory: respScore,
            cardiovascular: cardioScore,
            neurological: neuroScore
        },
        flag: total >= 4 // flag true -> "organ_failure_risk"
    };
}

module.exports = { calculateSimplifiedSOFA };