/**
 * Calculates Modified Shock Index (MSI) = Heart Rate / Mean Arterial Pressure
 *
 * @param {Object} vitals
 * @param {number} vitals.heartRate - Heart Rate (bpm)
 * @param {number} vitals.systolic - Systolic Blood Pressure (mmHg)
 * @param {number} vitals.diastolic - Diastolic Blood Pressure (mmHg)
 * @returns {Object} { msi, level, flag }
 */
function calculateMSI(vitals) {
    const { heartRate, systolic, diastolic } = vitals;

    // Guard: need valid inputs to compute
    if (
        heartRate == null || systolic == null || diastolic == null ||
        isNaN(heartRate) || isNaN(systolic) || isNaN(diastolic)
    ) {
        return { msi: 0, level: 'unknown', flag: false };
    }

    const hr = parseFloat(heartRate);
    const sbp = parseFloat(systolic);
    const dbp = parseFloat(diastolic);

    // Mean Arterial Pressure
    const map = (sbp + 2 * dbp) / 3;

    // Guard against division by zero
    if (map === 0) {
        return { msi: 999, level: 'severe_shock', flag: true };
    }

    const msi = hr / map;
    const msiRounded = parseFloat(msi.toFixed(2));

    let level;
    if (msiRounded < 0.7) {
        level = 'normal';
    } else if (msiRounded <= 1.0) {
        level = 'elevated';
    } else if (msiRounded <= 1.4) {
        level = 'shock_risk';
    } else {
        level = 'severe_shock';
    }

    return {
        msi: msiRounded,
        level,
        flag: msiRounded > 1.0
    };
}

module.exports = { calculateMSI };
