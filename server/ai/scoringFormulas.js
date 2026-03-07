/**
 * Scoring Formulas Reference
 * Pure functions for calculating medical scores.
 */

/**
 * Calculates Modified Early Warning Score (MEWS)
 * @param {Object} vitals - { respiratoryRate, heartRate, systolicBP, temperature, avpu }
 * @returns {number} MEWS score (0-14, highly critical if >= 5)
 */
function calculateMEWS(vitals) {
    let score = 0;
    const { respiratoryRate: rr, heartRate: hr, systolicBP: sbp, temperature: temp, avpu } = vitals;

    // Respiratory Rate
    if (rr != null) {
        if (rr <= 8) score += 2;
        else if (rr >= 9 && rr <= 14) score += 0;
        else if (rr >= 15 && rr <= 20) score += 1;
        else if (rr >= 21 && rr <= 29) score += 2;
        else if (rr >= 30) score += 3;
    }

    // Heart Rate
    if (hr != null) {
        if (hr <= 40) score += 2;
        else if (hr >= 41 && hr <= 50) score += 1;
        else if (hr >= 51 && hr <= 100) score += 0;
        else if (hr >= 101 && hr <= 110) score += 1;
        else if (hr >= 111 && hr <= 129) score += 2;
        else if (hr >= 130) score += 3;
    }

    // Systolic BP
    if (sbp != null) {
        if (sbp <= 70) score += 3;
        else if (sbp >= 71 && sbp <= 80) score += 2;
        else if (sbp >= 81 && sbp <= 100) score += 1;
        else if (sbp >= 101 && sbp <= 199) score += 0;
        else if (sbp >= 200) score += 2;
    }

    // Temperature (Celsius)
    if (temp != null) {
        if (temp <= 35) score += 2;
        else if (temp > 35 && temp <= 36.0) score += 1;
        else if (temp > 36.0 && temp <= 38.0) score += 0;
        else if (temp > 38.0 && temp <= 38.5) score += 1;
        else if (temp >= 38.6) score += 2;
    }

    // Consciousness (AVPU)
    if (avpu != null) {
        const a = avpu.toUpperCase();
        if (a === 'A' || a === 'ALERT') score += 0;
        else if (a === 'V' || a === 'VOICE') score += 1;
        else if (a === 'P' || a === 'PAIN') score += 2;
        else if (a === 'U' || a === 'UNRESPONSIVE') score += 3;
    }

    return score;
}

/**
 * Calculates Shock Index
 * Elevated if > 0.9, Shock if > 1.0, Severe if > 1.4
 * @param {number} heartRate 
 * @param {number} systolicBP 
 * @returns {number} Shock Index (0 to 2+)
 */
function calculateShockIndex(heartRate, systolicBP) {
    if (!systolicBP || systolicBP === 0 || !heartRate) return 0;
    return parseFloat((heartRate / systolicBP).toFixed(2));
}

/**
 * Derives GCS (Glasgow Coma Scale) from AVPU
 * @param {string} avpu (Alert, Voice, Pain, Unresponsive)
 * @returns {number} GCS Score (3-15)
 */
function calculateGCS(avpu) {
    if (!avpu) return 15;
    const a = String(avpu).toUpperCase().charAt(0);
    if (a === 'A') return 15;
    if (a === 'V') return 13;
    if (a === 'P') return 8;
    if (a === 'U') return 3;
    return 15; // default to Alert if unparseable
}

/**
 * Calculates Revised Trauma Score (RTS)
 * @param {number} gcs - Glasgow Coma Scale (3-15)
 * @param {number} systolicBP - Systolic Blood Pressure
 * @param {number} respiratoryRate - Respiratory Rate
 * @returns {number} RTS Score (0-7.84)
 */
function calculateRTS(gcs, systolicBP, respiratoryRate) {
    let gcsCoded = 0;
    if (gcs >= 13) gcsCoded = 4;
    else if (gcs >= 9) gcsCoded = 3;
    else if (gcs >= 6) gcsCoded = 2;
    else if (gcs >= 4) gcsCoded = 1;
    else gcsCoded = 0;

    let sbpCoded = 0;
    if (systolicBP > 89) sbpCoded = 4;
    else if (systolicBP >= 76) sbpCoded = 3;
    else if (systolicBP >= 50) sbpCoded = 2;
    else if (systolicBP >= 1) sbpCoded = 1;
    else sbpCoded = 0;

    let rrCoded = 0;
    if (respiratoryRate >= 10 && respiratoryRate <= 29) rrCoded = 4;
    else if (respiratoryRate > 29) rrCoded = 3;
    else if (respiratoryRate >= 6 && respiratoryRate <= 9) rrCoded = 2;
    else if (respiratoryRate >= 1 && respiratoryRate <= 5) rrCoded = 1;
    else rrCoded = 0;

    const rts = (0.9368 * gcsCoded) + (0.7326 * sbpCoded) + (0.2908 * rrCoded);
    return parseFloat(rts.toFixed(2));
}

/**
 * Calculates Simplified SOFA Score (approx 0-8)
 * @param {number} spO2 - Oxygen saturation % (respiratory)
 * @param {number} systolicBP 
 * @param {number} diastolicBP 
 * @param {number} gcs - Glasgow Coma Scale (neuro)
 * @returns {number} SOFA Score
 */
function calculateSimplifiedSOFA(spO2, systolicBP, diastolicBP, gcs) {
    let score = 0;

    // Respiratory (SpO2)
    if (spO2 != null) {
        if (spO2 < 92) score += 2;
        else if (spO2 >= 92 && spO2 <= 95) score += 1;
    }

    // Cardiovascular (MAP)
    if (systolicBP != null && diastolicBP != null) {
        const map = (systolicBP + 2 * diastolicBP) / 3;
        if (map < 65) score += 2;
        else if (map < 70) score += 1;
    }

    // Neuro (GCS)
    if (gcs != null) {
        if (gcs < 13) score += 2;
        else if (gcs >= 13 && gcs <= 14) score += 1;
    }

    return score;
}

module.exports = {
    calculateMEWS,
    calculateShockIndex,
    calculateGCS,
    calculateRTS,
    calculateSimplifiedSOFA
};
