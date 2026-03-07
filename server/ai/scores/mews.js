/**
 * Calculates the Modified Early Warning Score (MEWS)
 * 
 * @param {Object} params 
 * @param {number} params.heartRate - Heart Rate (bpm)
 * @param {number} params.systolic - Systolic Blood Pressure (mmHg)
 * @param {number} params.respiratoryRate - Respiratory Rate (breaths/min)
 * @param {number} params.temperature - Temperature (°C)
 * @param {string} params.consciousness - "Alert", "Voice", "Pain", or "Unresponsive"
 * @returns {Object} { score, components: { hr, sbp, rr, temp, avpu }, interpretation }
 */
function calculateMEWS({ heartRate, systolic, respiratoryRate, temperature, consciousness }) {
    let hrScore = 0;
    let sbpScore = 0;
    let rrScore = 0;
    let tempScore = 0;
    let avpuScore = 0;

    // Respiratory Rate
    if (respiratoryRate != null) {
        if (respiratoryRate < 9) rrScore = 2;
        else if (respiratoryRate >= 9 && respiratoryRate <= 14) rrScore = 0;
        else if (respiratoryRate >= 15 && respiratoryRate <= 20) rrScore = 1;
        else if (respiratoryRate >= 21 && respiratoryRate <= 29) rrScore = 2;
        else if (respiratoryRate >= 30) rrScore = 3;
    }

    // Heart Rate
    if (heartRate != null) {
        if (heartRate < 40) hrScore = 2;
        else if (heartRate >= 40 && heartRate <= 50) hrScore = 1;
        else if (heartRate >= 51 && heartRate <= 100) hrScore = 0;
        else if (heartRate >= 101 && heartRate <= 110) hrScore = 1;
        else if (heartRate >= 111 && heartRate <= 129) hrScore = 2;
        else if (heartRate >= 130) hrScore = 3;
    }

    // Systolic BP
    if (systolic != null) {
        if (systolic < 70) sbpScore = 3;
        else if (systolic >= 71 && systolic <= 80) sbpScore = 2;
        else if (systolic >= 81 && systolic <= 100) sbpScore = 1;
        else if (systolic >= 101 && systolic <= 199) sbpScore = 0;
        else if (systolic >= 200) sbpScore = 2;
    }

    // Temperature
    if (temperature != null) {
        if (temperature < 35) tempScore = 2;
        else if (temperature >= 35 && temperature <= 38.4) tempScore = 0;
        else if (temperature >= 38.5) tempScore = 2;
    }

    // Consciousness
    if (consciousness != null) {
        const c = String(consciousness).toLowerCase();
        if (c.includes('alert')) avpuScore = 0;
        else if (c.includes('voice')) avpuScore = 1;
        else if (c.includes('pain')) avpuScore = 2;
        else if (c.includes('unresponsive')) avpuScore = 3;
    }

    const score = hrScore + sbpScore + rrScore + tempScore + avpuScore;

    let interpretation = "Low risk";
    if (score >= 5) interpretation = "High risk — urgent review needed";
    else if (score >= 3) interpretation = "Medium risk";

    return {
        score,
        interpretation,
        components: {
            hr: hrScore,
            sbp: sbpScore,
            rr: rrScore,
            temp: tempScore,
            avpu: avpuScore
        }
    };
}

module.exports = { calculateMEWS };