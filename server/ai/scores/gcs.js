/**
 * Derives Glasgow Coma Scale (GCS) Score from AVPU assessment.
 * Standard clinical conversion used when full GCS is not available.
 * 
 * @param {string} avpu - "Alert", "Voice", "Pain", or "Unresponsive"
 * @returns {number} Derived GCS Score (3-15)
 */
function deriveGCSFromAVPU(avpu) {
    const map = { 'Alert': 15, 'Voice': 13, 'Pain': 8, 'Unresponsive': 3 };
    // Default to 15 (Alert) if avpu string is not strictly matched. 
    // We can enhance this later to do case-insensitive or partial matching if needed.
    return map[avpu] || 15;
}

/**
 * Calculates full Glasgow Coma Scale (GCS)
 * 
 * @param {Object} params 
 * @param {number} params.eyeOpening - Eye Response (1-4)
 * @param {number} params.verbalResponse - Verbal Response (1-5)
 * @param {number} params.motorResponse - Motor Response (1-6)
 * @returns {Object} { score: number, severity: string, flag: boolean }
 */
function calculateGCS({ eyeOpening, verbalResponse, motorResponse }) {
    // Defaults assume normal response if a component is omitted
    const score = (eyeOpening || 4) + (verbalResponse || 5) + (motorResponse || 6);

    let severity;
    if (score >= 13) {
        severity = 'mild';
    } else if (score >= 9) {
        severity = 'moderate';
    } else {
        severity = 'severe'; // <= 8 indicates severe brain injury risk
    }

    return {
        score,
        severity,
        flag: score < 9 // If flag is true, severity aggregator will add "brain_injury_risk"
    };
}

module.exports = { deriveGCSFromAVPU, calculateGCS };