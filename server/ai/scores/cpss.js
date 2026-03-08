/**
 * Cincinnati Prehospital Stroke Scale (CPSS)
 *
 * A rapid stroke screening tool used by EMS personnel.
 * Tests three signs: facial droop, arm drift, and speech abnormality.
 * Any positive finding suggests possible stroke.
 *
 * @param {Object} vitals
 * @param {boolean} vitals.facialDroop   - Facial droop present?
 * @param {boolean} vitals.armDrift      - Arm drift present?
 * @param {boolean} vitals.speechAbnormality - Speech abnormality present?
 * @returns {Object} { score, strokeRisk, components, flag }
 */
function calculateCPSS(vitals) {
  const facialDroop = !!vitals.facialDroop;
  const armDrift = !!vitals.armDrift;
  const speechAbnormality = !!vitals.speechAbnormality;

  const components = {
    facialDroop: facialDroop ? 1 : 0,
    armDrift: armDrift ? 1 : 0,
    speechAbnormality: speechAbnormality ? 1 : 0,
  };

  const score = components.facialDroop + components.armDrift + components.speechAbnormality;
  const strokeRisk = score >= 1;

  return {
    score,
    strokeRisk,
    components,
    flag: strokeRisk,
  };
}

module.exports = { calculateCPSS };
