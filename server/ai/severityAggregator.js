const { calculateMEWS } = require("./scores/mews");
const { calculateShockIndex } = require("./scores/shockIndex");
const { calculateRTS } = require("./scores/rts");
const { calculateSimplifiedSOFA } = require("./scores/sofa");
const { deriveGCSFromAVPU } = require("./scores/gcs");

// ── Extended scoring models ──
const { calculateNEWS2 } = require("./scores/news2");
const { calculateMSI } = require("./scores/modifiedShockIndex");
const { calculateQSOFA } = require("./scores/qsofa");
const { calculatePRESEP } = require("./scores/presep");
const { calculatePulsePressure } = require("./scores/pulsePressure");
const { calculateCPSS } = require("./scores/cpss");
const { calculateCRB65 } = require("./scores/crb65");
const { calculatePAT } = require("./scores/pat");
const { calculateSTART } = require("./scores/startTriage");

/**
 * Main AI function called by P3 to aggregate severity.
 * Runs all scoring models and produces a single unified severity object.
 *
 * @param {Object} vitals
 * @returns {Object} { score, level, canWait, flags, breakdown, survivalProbability }
 */
function calculateSeverity(vitals) {
  const {
    heartRate,
    systolic,
    diastolic,
    respiratoryRate,
    temperature,
    oxygenSat,
    consciousness,
    age,
    conditions = [],
  } = vitals;

  const gcsScore = deriveGCSFromAVPU(consciousness);
  const mews = calculateMEWS({
    heartRate,
    systolic,
    respiratoryRate,
    temperature,
    consciousness,
  });
  const shock = calculateShockIndex({ heartRate, systolic });
  const rts = calculateRTS({ gcsScore, systolic, respiratoryRate });
  const sofa = calculateSimplifiedSOFA({
    oxygenSat,
    systolic,
    diastolic,
    gcsScore,
  });

  const flags = [];
  if (shock.flag) flags.push("shock_risk");
  if (sofa.flag) flags.push("organ_failure_risk");
  if (rts.flag) flags.push("critical_trauma");
  if (gcsScore < 9) flags.push("brain_injury_risk");
  if (oxygenSat < 90) flags.push("respiratory_distress");

  // Condition multipliers
  let multiplier = 1.0;
  if (conditions.includes("Heart Disease") && heartRate > 100)
    multiplier += 0.15;
  if (conditions.includes("Diabetes") && temperature > 38.5) multiplier += 0.1;
  if (age > 65) multiplier += 0.1;

  // Composite score: 0-100
  // MEWS: max 14 -> normalize. RTS: max 7.84 (lower = worse, invert). SOFA: max 9.
  const mewsNorm = (mews.score / 14) * 100;
  const rtsNorm = ((7.84 - rts.score) / 7.84) * 100;
  const sofaNorm = (sofa.score / 9) * 100;
  const shockNorm = Math.min(shock.score * 50, 100);

  const rawScore =
    mewsNorm * 0.3 + rtsNorm * 0.25 + sofaNorm * 0.25 + shockNorm * 0.2;
  let finalScore = Math.min(Math.round(rawScore * multiplier), 100);

  // ── Run all 9 extended scoring models ──
  const news2 = calculateNEWS2(vitals);
  const modifiedShockIndex = calculateMSI(vitals);
  const qsofa = calculateQSOFA(vitals);
  const presep = calculatePRESEP(vitals);
  const pulsePressure = calculatePulsePressure(vitals);
  const cpss = calculateCPSS(vitals);
  const crb65 = calculateCRB65(vitals);
  const pat = calculatePAT(vitals);
  const startTriage = calculateSTART(vitals);

  // ── Add extended flags ──
  if (qsofa.flag && !flags.includes("sepsis_risk")) flags.push("sepsis_risk");
  if (presep.flag && !flags.includes("sepsis_risk")) flags.push("sepsis_risk");
  if (cpss.flag) flags.push("stroke_risk");
  if (modifiedShockIndex.flag && !flags.includes("shock_risk"))
    flags.push("shock_risk");
  if (pulsePressure.flag) flags.push("cardiac_tamponade_risk");
  if (crb65.flag) flags.push("severe_pneumonia_risk");
  if (pat.flag) flags.push("pediatric_critical");
  if (startTriage.category === "IMMEDIATE")
    flags.push("mass_casualty_immediate");
  if (news2.score >= 7) flags.push("high_deterioration_risk");

  // ── Conditional score adjustments ──
  if (qsofa.score >= 2 && finalScore < 50) finalScore += 10;
  if (cpss.strokeRisk === true && finalScore < 60)
    finalScore = Math.max(finalScore, 65);
  if (pat.pediatricConcern === true && finalScore < 55)
    finalScore = Math.max(finalScore, 60);
  if (startTriage.category === "IMMEDIATE")
    finalScore = Math.max(finalScore, 75);

  // Cap at 100
  finalScore = Math.min(finalScore, 100);

  const level =
    finalScore >= 70 ? "critical" : finalScore >= 40 ? "urgent" : "stable";
  const canWait = finalScore < 60;

  return {
    score: finalScore,
    level,
    canWait,
    flags,
    breakdown: {
      mews: mews.score,
      shockIndex: shock.score,
      rts: rts.score,
      sofa: sofa.score,
    },
    survivalProbability: rts.survivalProbability,
    extendedScores: {
      news2,
      modifiedShockIndex,
      qsofa,
      presep,
      pulsePressure,
      cpss,
      crb65,
      pat,
      startTriage,
    },
  };
}

module.exports = { calculateSeverity };
