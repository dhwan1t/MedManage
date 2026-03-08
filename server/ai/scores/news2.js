/**
 * Calculates the National Early Warning Score 2 (NEWS2)
 *
 * @param {Object} vitals
 * @param {number} vitals.respiratoryRate - Respiratory Rate (breaths/min)
 * @param {number} vitals.oxygenSat - SpO2 (%)
 * @param {boolean} vitals.onSupplementalOxygen - Whether patient is on supplemental O2
 * @param {number} vitals.systolic - Systolic Blood Pressure (mmHg)
 * @param {number} vitals.heartRate - Heart Rate (bpm)
 * @param {string} vitals.consciousness - AVPU: "Alert", "Voice", "Pain", or "Unresponsive"
 * @param {number} vitals.temperature - Temperature (°C)
 * @returns {Object} { score, riskLevel, components, flag }
 */
function calculateNEWS2(vitals) {
    const {
        respiratoryRate,
        oxygenSat,
        onSupplementalOxygen,
        systolic,
        heartRate,
        consciousness,
        temperature
    } = vitals;

    // Respiratory Rate scoring
    let rrScore = 0;
    if (respiratoryRate != null) {
        if (respiratoryRate <= 8) rrScore = 3;
        else if (respiratoryRate >= 9 && respiratoryRate <= 11) rrScore = 1;
        else if (respiratoryRate >= 12 && respiratoryRate <= 20) rrScore = 0;
        else if (respiratoryRate >= 21 && respiratoryRate <= 24) rrScore = 2;
        else if (respiratoryRate >= 25) rrScore = 3;
    }

    // SpO2 scoring — depends on whether patient is on supplemental oxygen
    let spo2Score = 0;
    if (oxygenSat != null) {
        if (onSupplementalOxygen) {
            // Scale 2: on supplemental oxygen
            if (oxygenSat <= 83) spo2Score = 3;
            else if (oxygenSat >= 84 && oxygenSat <= 85) spo2Score = 2;
            else if (oxygenSat >= 86 && oxygenSat <= 87) spo2Score = 1;
            else if (oxygenSat >= 88 && oxygenSat <= 92) spo2Score = 0;
            else if (oxygenSat >= 93 && oxygenSat <= 94) spo2Score = 1;
            else if (oxygenSat >= 95 && oxygenSat <= 96) spo2Score = 2;
            else if (oxygenSat >= 97) spo2Score = 3;
        } else {
            // Scale 1: not on supplemental oxygen
            if (oxygenSat <= 91) spo2Score = 3;
            else if (oxygenSat >= 92 && oxygenSat <= 93) spo2Score = 2;
            else if (oxygenSat >= 94 && oxygenSat <= 95) spo2Score = 1;
            else if (oxygenSat >= 96) spo2Score = 0;
        }
    }

    // Supplemental oxygen scoring
    let o2Score = 0;
    if (onSupplementalOxygen) o2Score = 2;

    // Systolic BP scoring
    let sbpScore = 0;
    if (systolic != null) {
        if (systolic <= 90) sbpScore = 3;
        else if (systolic >= 91 && systolic <= 100) sbpScore = 2;
        else if (systolic >= 101 && systolic <= 110) sbpScore = 1;
        else if (systolic >= 111 && systolic <= 219) sbpScore = 0;
        else if (systolic >= 220) sbpScore = 3;
    }

    // Heart Rate scoring
    let hrScore = 0;
    if (heartRate != null) {
        if (heartRate <= 40) hrScore = 3;
        else if (heartRate >= 41 && heartRate <= 50) hrScore = 1;
        else if (heartRate >= 51 && heartRate <= 90) hrScore = 0;
        else if (heartRate >= 91 && heartRate <= 110) hrScore = 1;
        else if (heartRate >= 111 && heartRate <= 130) hrScore = 2;
        else if (heartRate >= 131) hrScore = 3;
    }

    // Consciousness scoring
    let consciousnessScore = 0;
    if (consciousness != null) {
        const c = String(consciousness).toLowerCase();
        if (c.includes('alert')) consciousnessScore = 0;
        else consciousnessScore = 3; // Voice, Pain, or Unresponsive
    }

    // Temperature scoring
    let tempScore = 0;
    if (temperature != null) {
        if (temperature <= 35.0) tempScore = 3;
        else if (temperature >= 35.1 && temperature <= 36.0) tempScore = 1;
        else if (temperature >= 36.1 && temperature <= 38.0) tempScore = 0;
        else if (temperature >= 38.1 && temperature <= 39.0) tempScore = 1;
        else if (temperature >= 39.1) tempScore = 2;
    }

    const score = rrScore + spo2Score + o2Score + sbpScore + hrScore + consciousnessScore + tempScore;

    // Risk level: Low=1-4, Medium=5-6, High>=7
    let riskLevel;
    if (score >= 7) riskLevel = 'High';
    else if (score >= 5) riskLevel = 'Medium';
    else riskLevel = 'Low';

    return {
        score,
        riskLevel,
        components: {
            respiratoryRate: rrScore,
            spo2: spo2Score,
            supplementalO2: o2Score,
            systolicBP: sbpScore,
            heartRate: hrScore,
            consciousness: consciousnessScore,
            temperature: tempScore
        },
        flag: score >= 7
    };
}

module.exports = { calculateNEWS2 };
