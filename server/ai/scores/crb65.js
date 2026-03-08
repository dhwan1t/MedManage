/**
 * CRB-65 Pneumonia Severity Score
 *
 * A community-based scoring system for assessing pneumonia severity
 * without requiring lab tests (unlike CURB-65 which needs BUN).
 *
 * Criteria (1 point each):
 *   C — Confusion: consciousness !== 'Alert'
 *   R — Respiratory rate >= 30
 *   B — Blood pressure: systolic < 90 OR diastolic <= 60
 *   65 — Age >= 65
 *
 * Score 0-4
 * Severity:
 *   0       = Low
 *   1-2     = Moderate
 *   3-4     = High
 *
 * @param {Object} vitals
 * @param {string} vitals.consciousness - AVPU level: "Alert", "Voice", "Pain", "Unresponsive"
 * @param {number} vitals.respiratoryRate - Breaths per minute
 * @param {number} vitals.systolic - Systolic blood pressure (mmHg)
 * @param {number} vitals.diastolic - Diastolic blood pressure (mmHg)
 * @param {number} vitals.age - Patient age in years
 * @returns {Object} { score, severity, pneumoniaRisk, components, flag }
 */
function calculateCRB65(vitals) {
    const {
        consciousness,
        respiratoryRate,
        systolic,
        diastolic,
        age
    } = vitals;

    const components = {
        confusion: false,
        respiratoryRate: false,
        bloodPressure: false,
        age65: false
    };

    let score = 0;

    // C — Confusion (altered mental status)
    if (consciousness != null) {
        const c = String(consciousness).toLowerCase();
        if (!c.includes('alert')) {
            components.confusion = true;
            score += 1;
        }
    }

    // R — Respiratory rate >= 30
    if (respiratoryRate != null && respiratoryRate >= 30) {
        components.respiratoryRate = true;
        score += 1;
    }

    // B — Blood pressure: systolic < 90 OR diastolic <= 60
    if (
        (systolic != null && systolic < 90) ||
        (diastolic != null && diastolic <= 60)
    ) {
        components.bloodPressure = true;
        score += 1;
    }

    // 65 — Age >= 65
    if (age != null && age >= 65) {
        components.age65 = true;
        score += 1;
    }

    // Determine severity level
    let severity;
    if (score === 0) {
        severity = 'Low';
    } else if (score <= 2) {
        severity = 'Moderate';
    } else {
        severity = 'High';
    }

    return {
        score,
        severity,
        pneumoniaRisk: score >= 3,
        components,
        flag: score >= 3
    };
}

module.exports = { calculateCRB65 };
