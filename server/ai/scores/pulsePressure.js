/**
 * Calculates Pulse Pressure and categorizes cardiovascular risk.
 *
 * Pulse Pressure = Systolic BP − Diastolic BP
 *
 * Thresholds:
 *   < 25    → Narrow (cardiac tamponade / shock risk)
 *   25-40   → Low-normal
 *   41-60   → Normal
 *   > 60    → Wide (aortic regurgitation risk)
 *
 * @param {Object} vitals
 * @param {number} vitals.systolic  - Systolic Blood Pressure (mmHg)
 * @param {number} vitals.diastolic - Diastolic Blood Pressure (mmHg)
 * @returns {Object} { pulsePressure, category, flag }
 */
function calculatePulsePressure(vitals) {
  const { systolic, diastolic } = vitals;

  if (systolic == null || diastolic == null) {
    return {
      pulsePressure: null,
      category: 'Unknown',
      flag: false,
    };
  }

  const pulsePressure = systolic - diastolic;

  let category;
  if (pulsePressure < 25) {
    category = 'Narrow';
  } else if (pulsePressure <= 40) {
    category = 'Low-normal';
  } else if (pulsePressure <= 60) {
    category = 'Normal';
  } else {
    category = 'Wide';
  }

  return {
    pulsePressure,
    category,
    flag: pulsePressure < 25,
  };
}

module.exports = { calculatePulsePressure };
