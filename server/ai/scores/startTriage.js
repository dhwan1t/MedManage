/**
 * START (Simple Triage and Rapid Treatment) Mass Casualty Triage
 *
 * Uses respiratory rate, heart rate (radial pulse proxy), and consciousness (AVPU)
 * to assign a triage category for mass casualty incidents.
 *
 * @param {Object} vitals
 * @param {number} vitals.respiratoryRate - Respiratory rate (breaths/min)
 * @param {number} vitals.heartRate - Heart rate (bpm), used as radial pulse proxy
 * @param {string} vitals.consciousness - AVPU: "Alert", "Voice", "Pain", "Unresponsive"
 * @returns {Object} { category, color, priority, flag }
 */
function calculateSTART(vitals) {
  const { respiratoryRate, heartRate, consciousness } = vitals;

  const rr = respiratoryRate != null ? parseFloat(respiratoryRate) : null;
  const hr = heartRate != null ? parseFloat(heartRate) : null;
  const avpu = consciousness ? String(consciousness).trim() : "Alert";

  // ── DECEASED: no respirations ──
  if (rr === 0) {
    return {
      category: "DECEASED",
      color: "black",
      priority: 4,
      flag: false,
    };
  }

  // ── IMMEDIATE (Red): any single critical finding ──
  const rrCritical = rr != null && rr > 30;
  const noRadialPulse = hr === 0;
  const consciousnessLower = avpu.toLowerCase();
  const alteredCritical =
    consciousnessLower === "unresponsive" || consciousnessLower === "pain";

  if (rrCritical || noRadialPulse || alteredCritical) {
    return {
      category: "IMMEDIATE",
      color: "red",
      priority: 1,
      flag: true,
    };
  }

  // ── DELAYED (Yellow): walking wounded — Alert, RR 10-30, pulse present ──
  const rrDelayed = rr != null && rr >= 10 && rr <= 30;
  const pulsePresent = hr != null && hr > 0;
  const isAlert = consciousnessLower === "alert";

  if (isAlert && rrDelayed && pulsePresent) {
    // Check if any vitals are slightly abnormal but not critical
    // If consciousness is Alert and RR is in range but there's a Voice response
    // or other minor concern, classify as DELAYED
    // For truly normal vitals, classify as MINIMAL below
    const rrNormal = rr != null && rr >= 12 && rr <= 20;
    const hrNormal = hr != null && hr >= 60 && hr <= 100;

    if (rrNormal && hrNormal) {
      // ── MINIMAL (Green): all vitals normal + Alert ──
      return {
        category: "MINIMAL",
        color: "green",
        priority: 3,
        flag: false,
      };
    }

    return {
      category: "DELAYED",
      color: "yellow",
      priority: 2,
      flag: false,
    };
  }

  // ── Voice consciousness with acceptable vitals → DELAYED ──
  if (consciousnessLower === "voice" && rrDelayed && pulsePresent) {
    return {
      category: "DELAYED",
      color: "yellow",
      priority: 2,
      flag: false,
    };
  }

  // ── Fallback: if we reach here, classify based on best available info ──
  // If RR is between 1-9 (very low but breathing) or other edge cases
  if (pulsePresent && (isAlert || consciousnessLower === "voice")) {
    return {
      category: "DELAYED",
      color: "yellow",
      priority: 2,
      flag: false,
    };
  }

  // Default to IMMEDIATE for safety if data is ambiguous
  return {
    category: "IMMEDIATE",
    color: "red",
    priority: 1,
    flag: true,
  };
}

module.exports = { calculateSTART };
