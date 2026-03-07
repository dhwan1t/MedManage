const { getDistance } = require("../utils/geo");

/**
 * Receives the severity object + list of hospitals from DB and returns
 * a ranked array of hospital recommendations.
 *
 * P2-01: Uses shared getDistance from utils/geo instead of duplicated function.
 * P2-06: Estimated cost is now computed from hospital's own `estimatedCost` field,
 *         falling back to type-based ranges only as a last resort with a warning flag.
 * P2-07: No more silent fallback to hardcoded coords (30.9, 75.85).
 *         If patient coords are missing, distance scoring is skipped and flagged.
 *
 * @param {Object} severity - Result from calculateSeverity()
 * @param {Object} vitals - Patient vitals and info { patientLat, patientLng, ... }
 * @param {Array} hospitals - Array of hospital objects from DB
 * @returns {Array} Top 3 recommended hospitals ranked
 */
function rankHospitals(severity, vitals, hospitals) {
  // Determine what resources the patient needs
  const needs = [];
  if (severity.score > 70) needs.push("icuBeds");
  if (severity.flags.includes("critical_trauma")) needs.push("otTheatres");
  if (severity.flags.includes("respiratory_distress")) needs.push("erBays");
  if (!needs.length) needs.push("generalBeds");

  // Check if we have valid patient coordinates
  const hasPatientCoords =
    vitals.patientLat != null &&
    vitals.patientLng != null &&
    !isNaN(vitals.patientLat) &&
    !isNaN(vitals.patientLng);

  const patLat = hasPatientCoords ? parseFloat(vitals.patientLat) : null;
  const patLng = hasPatientCoords ? parseFloat(vitals.patientLng) : null;

  if (!hasPatientCoords) {
    console.warn(
      "hospitalRanker: Patient coordinates missing — distance scoring will be skipped.",
    );
  }

  const scoredHospitals = hospitals.map((hospital) => {
    // Handle Mongoose documents if passed
    const h = hospital.toObject ? hospital.toObject() : hospital;
    let score = 0;
    const reasons = [];

    // 1. FACILITY MATCH (35 points)
    const facilityMatch = needs.every(
      (need) =>
        h.resources && h.resources[need] && h.resources[need].available > 0,
    );
    if (facilityMatch) {
      score += 35;
      reasons.push("Required facilities available");
    } else {
      reasons.push("⚠ Some required facilities unavailable");
    }

    // 2. DISTANCE SCORE (30 points) — only if patient coords available
    let dist = null;
    if (hasPatientCoords) {
      const hospLat = h.location && h.location.lat ? h.location.lat : null;
      const hospLng = h.location && h.location.lng ? h.location.lng : null;

      if (hospLat != null && hospLng != null) {
        dist = getDistance(patLat, patLng, hospLat, hospLng);
        const distScore = Math.max(0, 30 - dist * 3);
        score += distScore;
        reasons.push(`${dist.toFixed(1)} km away`);
      } else {
        reasons.push("Hospital coordinates unavailable");
      }
    } else {
      reasons.push("Patient location unknown — distance not scored");
    }

    // 3. DOCTOR AVAILABILITY (20 points)
    const availDoctors = (h.doctors || []).filter((d) => d.available).length;
    const docScore = Math.min(availDoctors * 5, 20);
    score += docScore;
    if (availDoctors > 0) {
      reasons.push(`${availDoctors} doctors on duty`);
    } else {
      reasons.push("No doctors currently available");
    }

    // 4. RATING (15 points)
    const ratingScore = ((h.rating || 3) / 5) * 15;
    score += ratingScore;

    // CRITICAL OVERRIDE: if canWait is false, boost closest hospital
    if (!severity.canWait && dist != null && dist < 3) {
      score += 20;
    }

    // Cap the score at 100
    const finalScore = Math.min(Math.round(score), 100);

    // ── P2-06: Compute estimated cost from hospital data or type-based fallback ──
    let estimatedCost;
    if (h.estimatedCost) {
      // Prefer hospital-specific cost data if it exists in the DB
      estimatedCost = h.estimatedCost;
    } else if (h.avgCostRange) {
      estimatedCost = h.avgCostRange;
    } else {
      // Fallback by type — flagged so the frontend can indicate it's an estimate
      const costByType = {
        govt: "₹2,000–5,000 (est.)",
        private: "₹8,000–20,000 (est.)",
        trust: "₹3,000–8,000 (est.)",
      };
      estimatedCost = costByType[h.type] || "Contact hospital for pricing";
    }

    // ── Compute ETA from distance if available ──
    let estimatedMinutes = null;
    if (dist != null) {
      estimatedMinutes = Math.round(dist * 2.5 + 2);
    }

    return {
      hospitalId: h._id,
      name: h.name,
      type: h.type,
      distance: dist != null ? parseFloat(dist.toFixed(1)) : null,
      estimatedMinutes,
      facilityMatch,
      score: finalScore,
      reason: reasons.join(" · "),
      resources: h.resources,
      estimatedCost,
      survivalProbability: severity.survivalProbability,
    };
  });

  // Sort by score descending and return top 3
  return scoredHospitals.sort((a, b) => b.score - a.score).slice(0, 3);
}

module.exports = { rankHospitals };
