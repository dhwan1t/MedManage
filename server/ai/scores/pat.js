/**
 * Pediatric Assessment Triangle (PAT) — Age-adjusted vital sign scoring.
 *
 * Only applicable for patients under 18 years of age.
 * Compares heart rate, respiratory rate, SpO2, and consciousness against
 * age-group-specific normal ranges and assigns 0 (normal), 1 (abnormal),
 * or 2 (critical) for each vital.
 *
 * @param {Object} vitals
 * @param {number} vitals.age              - Patient age in years
 * @param {number} vitals.heartRate        - Heart rate (bpm)
 * @param {number} vitals.respiratoryRate  - Respiratory rate (breaths/min)
 * @param {number} vitals.oxygenSat        - SpO2 (%)
 * @param {string} vitals.consciousness    - AVPU: "Alert", "Voice", "Pain", "Unresponsive"
 * @returns {Object} { score, ageGroup, abnormalities, pediatricConcern, flag } | { notApplicable: true }
 */
function calculatePAT(vitals) {
  const { age, heartRate, respiratoryRate, oxygenSat, consciousness } = vitals;

  // Not applicable for adults
  if (age == null || age >= 18) {
    return { notApplicable: true };
  }

  // ── Age-adjusted normal ranges ──
  // Each range: { hrLow, hrHigh, rrLow, rrHigh }
  const AGE_RANGES = [
    { label: "Infant",     minAge: 0,  maxAge: 1,  hrLow: 100, hrHigh: 160, rrLow: 30, rrHigh: 60 },
    { label: "Toddler",    minAge: 1,  maxAge: 3,  hrLow: 90,  hrHigh: 150, rrLow: 24, rrHigh: 40 },
    { label: "Preschool",  minAge: 3,  maxAge: 5,  hrLow: 80,  hrHigh: 140, rrLow: 22, rrHigh: 34 },
    { label: "School-age", minAge: 6,  maxAge: 12, hrLow: 70,  hrHigh: 120, rrLow: 18, rrHigh: 30 },
    { label: "Adolescent", minAge: 12, maxAge: 17, hrLow: 60,  hrHigh: 100, rrLow: 12, rrHigh: 20 },
  ];

  // Find the matching age group
  let ageGroup = AGE_RANGES[AGE_RANGES.length - 1]; // default to adolescent
  for (const range of AGE_RANGES) {
    if (age >= range.minAge && age <= range.maxAge) {
      ageGroup = range;
      break;
    }
  }

  const abnormalities = [];
  let score = 0;

  // ── Heart Rate scoring ──
  if (heartRate != null) {
    if (heartRate >= ageGroup.hrLow && heartRate <= ageGroup.hrHigh) {
      // Normal — 0 points
    } else {
      // Determine how far outside normal range
      const deviation = heartRate < ageGroup.hrLow
        ? ageGroup.hrLow - heartRate
        : heartRate - ageGroup.hrHigh;
      // Critical if deviation is > 30% of the normal range span
      const rangeSpan = ageGroup.hrHigh - ageGroup.hrLow;
      if (deviation > rangeSpan * 0.3) {
        score += 2;
        abnormalities.push(`Heart rate critically abnormal (${heartRate} bpm)`);
      } else {
        score += 1;
        abnormalities.push(`Heart rate abnormal (${heartRate} bpm)`);
      }
    }
  }

  // ── Respiratory Rate scoring ──
  if (respiratoryRate != null) {
    if (respiratoryRate >= ageGroup.rrLow && respiratoryRate <= ageGroup.rrHigh) {
      // Normal — 0 points
    } else {
      const deviation = respiratoryRate < ageGroup.rrLow
        ? ageGroup.rrLow - respiratoryRate
        : respiratoryRate - ageGroup.rrHigh;
      const rangeSpan = ageGroup.rrHigh - ageGroup.rrLow;
      if (deviation > rangeSpan * 0.3) {
        score += 2;
        abnormalities.push(`Respiratory rate critically abnormal (${respiratoryRate}/min)`);
      } else {
        score += 1;
        abnormalities.push(`Respiratory rate abnormal (${respiratoryRate}/min)`);
      }
    }
  }

  // ── SpO2 scoring ──
  if (oxygenSat != null) {
    if (oxygenSat >= 95) {
      // Normal — 0 points
    } else if (oxygenSat >= 90) {
      score += 1;
      abnormalities.push(`SpO2 low (${oxygenSat}%)`);
    } else {
      score += 2;
      abnormalities.push(`SpO2 critically low (${oxygenSat}%)`);
    }
  }

  // ── Consciousness scoring ──
  if (consciousness != null) {
    const c = String(consciousness).toLowerCase();
    if (c.includes("alert")) {
      // Normal — 0 points
    } else if (c.includes("voice")) {
      score += 1;
      abnormalities.push("Responds to voice only");
    } else {
      // Pain or Unresponsive
      score += 2;
      abnormalities.push(`Consciousness: ${consciousness}`);
    }
  }

  const pediatricConcern = score >= 3;

  return {
    score,
    ageGroup: ageGroup.label,
    abnormalities,
    pediatricConcern,
    flag: pediatricConcern,
  };
}

module.exports = { calculatePAT };
