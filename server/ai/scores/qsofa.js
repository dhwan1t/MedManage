/**
 * Calculates the quick SOFA (qSOFA) score for sepsis screening.
 *
 * qSOFA is a bedside assessment tool that identifies patients with
 * suspected infection who are at greater risk for a poor outcome.
 *
 * @param {Object} vitals
 * @param {number} vitals.respiratoryRate - Respiratory rate (breaths/min)
 * @param {number} vitals.systolic - Systolic blood pressure (mmHg)
 * @param {string} vitals.consciousness - AVPU level: "Alert", "Voice", "Pain", or "Unresponsive"
 * @returns {Object} { score, sepsisRisk, components, flag }
 */
function calculateQSOFA(vitals) {
    const { respiratoryRate, systolic, consciousness } = vitals;

    const components = {
        respiratoryRate: 0,
        systolic: 0,
        alteredMentalStatus: 0,
    };

    // Respiratory rate >= 22 breaths/min → 1 point
    if (respiratoryRate != null && respiratoryRate >= 22) {
        components.respiratoryRate = 1;
    }

    // Systolic BP <= 100 mmHg → 1 point
    if (systolic != null && systolic <= 100) {
        components.systolic = 1;
    }

    // Altered mental status (anything other than Alert) → 1 point
    if (consciousness != null) {
        const c = String(consciousness).toLowerCase();
        if (!c.includes('alert')) {
            components.alteredMentalStatus = 1;
        }
    }

    const score = components.respiratoryRate + components.systolic + components.alteredMentalStatus;
    const sepsisRisk = score >= 2;

    return {
        score,
        sepsisRisk,
        components,
        flag: score >= 2,
    };
}

module.exports = { calculateQSOFA };
