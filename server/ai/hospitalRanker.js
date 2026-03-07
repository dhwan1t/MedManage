/**
 * Haversine distance in km
 * 
 * @param {number} lat1 
 * @param {number} lng1 
 * @param {number} lat2 
 * @param {number} lng2 
 * @returns {number} Distance in kilometers
 */
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Receives the severity object + list of hospitals from DB and returns
 * a ranked array of hospital recommendations.
 * 
 * @param {Object} severity - Result from calculateSeverity()
 * @param {Object} vitals - Patient vitals and info { patientLat, patientLng, ... }
 * @param {Array} hospitals - Array of hospital objects from DB
 * @returns {Array} Top 3 recommended hospitals ranked
 */
function rankHospitals(severity, vitals, hospitals) {
    // Determine what resources the patient needs
    const needs = [];
    if (severity.score > 70) needs.push('icuBeds');
    if (severity.flags.includes('critical_trauma')) needs.push('otTheatres');
    if (severity.flags.includes('respiratory_distress')) needs.push('erBays');
    if (!needs.length) needs.push('generalBeds');

    const scoredHospitals = hospitals.map(hospital => {
        // Handle Mongoose documents if passed
        const h = hospital.toObject ? hospital.toObject() : hospital;
        let score = 0;
        const reasons = [];

        // 1. FACILITY MATCH (35 points)
        // Check if hospital has > 0 availability for all needed resources
        const facilityMatch = needs.every(need => h.resources && h.resources[need] && h.resources[need].available > 0);
        if (facilityMatch) {
            score += 35;
            reasons.push('Required facilities available');
        } else {
            reasons.push('⚠ Some required facilities unavailable');
        }

        // 2. DISTANCE SCORE (30 points)
        // Use haversine distance. Fallback to (30.9, 75.85) if patient coords missing
        const patLat = vitals.patientLat || 30.9;
        const patLng = vitals.patientLng || 75.85;
        // Safely get hospital coordinates
        const hospLat = h.location && h.location.lat ? h.location.lat : 0;
        const hospLng = h.location && h.location.lng ? h.location.lng : 0;

        const dist = getDistance(patLat, patLng, hospLat, hospLng);
        const distScore = Math.max(0, 30 - dist * 3);
        score += distScore;
        reasons.push(`${dist.toFixed(1)} km away`);

        // 3. DOCTOR AVAILABILITY (20 points)
        const availDoctors = (h.doctors || []).filter(d => d.available).length;
        const docScore = Math.min(availDoctors * 5, 20);
        score += docScore;
        if (availDoctors > 0) {
            reasons.push(`${availDoctors} doctors on duty`);
        } else {
            reasons.push(`No doctors currently available`);
        }

        // 4. RATING (15 points)
        const ratingScore = ((h.rating || 3) / 5) * 15;
        score += ratingScore;

        // CRITICAL OVERRIDE: if canWait is false, boost closest hospital
        // If distance is < 3km, add 20 points
        if (!severity.canWait && dist < 3) {
            score += 20;
        }

        // Cap the score at 100
        const finalScore = Math.min(Math.round(score), 100);

        return {
            hospitalId: h._id,
            name: h.name,
            type: h.type,
            distance: parseFloat(dist.toFixed(1)),
            estimatedMinutes: Math.round(dist * 2.5 + 2),
            facilityMatch,
            score: finalScore,
            reason: reasons.join(' · '),
            resources: h.resources,
            estimatedCost: h.type === 'govt' ? '₹2,000–5,000' : '₹8,000–20,000',
            survivalProbability: severity.survivalProbability
        };
    });

    // Sort by score descending and return top 3
    return scoredHospitals.sort((a, b) => b.score - a.score).slice(0, 3);
}

module.exports = { rankHospitals };