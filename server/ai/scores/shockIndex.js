/**
 * Calculates Shock Index = Heart Rate / Systolic Blood Pressure
 * 
 * @param {Object} params 
 * @param {number} params.heartRate - Heart Rate (bpm)
 * @param {number} params.systolic - Systolic Blood Pressure (mmHg)
 * @returns {Object} { score: number, level: string, flag: boolean }
 */
function calculateShockIndex({ heartRate, systolic }) {
    if (!systolic || systolic === 0) return { score: 999, level: 'severe', flag: true };
    const si = heartRate / systolic;

    let level, flag;
    if (si < 0.6) {
        level = 'low';
        flag = false;
    } else if (si <= 0.9) {
        level = 'normal';
        flag = false;
    } else if (si <= 1.0) {
        level = 'elevated';
        flag = true;
    } else if (si <= 1.4) {
        level = 'shock';
        flag = true;
    } else {
        level = 'severe_shock';
        flag = true;
    }

    return { score: parseFloat(si.toFixed(2)), level, flag };
}

module.exports = { calculateShockIndex };