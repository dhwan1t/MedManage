/**
 * PRE-SEP (Pre-hospital Sepsis Screening) Score
 *
 * A pre-hospital screening tool for early identification of sepsis.
 * Each criterion met adds 1 point (max 7).
 *
 * @param {Object} vitals
 * @param {number} vitals.age
 * @param {number} vitals.heartRate - Heart Rate (bpm)
 * @param {number} vitals.respiratoryRate - Respiratory Rate (breaths/min)
 * @param {number} vitals.systolic - Systolic Blood Pressure (mmHg)
 * @param {number} vitals.oxygenSat - SpO2 (%)
 * @param {number} vitals.temperature - Temperature (°C)
 * @param {boolean} vitals.nursingHomeResident - Whether the patient is a nursing home resident
 * @returns {Object} { score, riskLevel, sepsisRisk, components, flag }
 */
function calculatePRESEP(vitals) {
  const {
    age,
    heartRate,
    respiratoryRate,
    systolic,
    oxygenSat,
    temperature,
    nursingHomeResident,
  } = vitals;

  const components = {};
  let score = 0;

  // Age >= 65
  if (age != null && age >= 65) {
    components.age = 1;
    score += 1;
  } else {
    components.age = 0;
  }

  // Nursing home resident
  if (nursingHomeResident === true) {
    components.nursingHomeResident = 1;
    score += 1;
  } else {
    components.nursingHomeResident = 0;
  }

  // Heart rate >= 125
  if (heartRate != null && heartRate >= 125) {
    components.heartRate = 1;
    score += 1;
  } else {
    components.heartRate = 0;
  }

  // Respiratory rate >= 25
  if (respiratoryRate != null && respiratoryRate >= 25) {
    components.respiratoryRate = 1;
    score += 1;
  } else {
    components.respiratoryRate = 0;
  }

  // Systolic BP <= 100
  if (systolic != null && systolic <= 100) {
    components.systolic = 1;
    score += 1;
  } else {
    components.systolic = 0;
  }

  // SpO2 < 95
  if (oxygenSat != null && oxygenSat < 95) {
    components.oxygenSat = 1;
    score += 1;
  } else {
    components.oxygenSat = 0;
  }

  // Temperature > 38.3 OR < 36
  if (temperature != null && (temperature > 38.3 || temperature < 36)) {
    components.temperature = 1;
    score += 1;
  } else {
    components.temperature = 0;
  }

  // Risk stratification
  let riskLevel;
  if (score <= 1) {
    riskLevel = "Low";
  } else if (score <= 3) {
    riskLevel = "Moderate";
  } else {
    riskLevel = "High";
  }

  const sepsisRisk = score >= 4;

  return {
    score,
    riskLevel,
    sepsisRisk,
    components,
    flag: score >= 4,
  };
}

module.exports = { calculatePRESEP };
