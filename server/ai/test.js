/**
 * MedManage AI Scoring Models — Comprehensive Test Runner
 *
 * Tests all 14 scoring models (5 existing + 9 new) with realistic
 * clinical vitals and prints results to the console.
 *
 * Run with:  node server/ai/test.js
 */

// ── Existing models (5) ──
const { calculateMEWS } = require("./scores/mews");
const { calculateShockIndex } = require("./scores/shockIndex");
const { calculateRTS } = require("./scores/rts");
const { calculateSimplifiedSOFA } = require("./scores/sofa");
const { deriveGCSFromAVPU, calculateGCS } = require("./scores/gcs");

// ── New models (9) ──
const { calculateNEWS2 } = require("./scores/news2");
const { calculateMSI } = require("./scores/modifiedShockIndex");
const { calculateQSOFA } = require("./scores/qsofa");
const { calculatePRESEP } = require("./scores/presep");
const { calculatePulsePressure } = require("./scores/pulsePressure");
const { calculateCPSS } = require("./scores/cpss");
const { calculateCRB65 } = require("./scores/crb65");
const { calculatePAT } = require("./scores/pat");
const { calculateSTART } = require("./scores/startTriage");

// ── Aggregator ──
const { calculateSeverity } = require("./severityAggregator");

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;

function header(title) {
  console.log("\n" + "═".repeat(60));
  console.log(`  ${title}`);
  console.log("═".repeat(60));
}

function runTest(label, fn) {
  try {
    const result = fn();
    console.log(`\n✅  ${label}`);
    console.log("   ", JSON.stringify(result, null, 2).split("\n").join("\n    "));
    passed++;
    return result;
  } catch (err) {
    console.log(`\n❌  ${label}`);
    console.log(`    ERROR: ${err.message}`);
    console.log(`    ${err.stack.split("\n").slice(1, 3).join("\n    ")}`);
    failed++;
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. Existing Models
// ═══════════════════════════════════════════════════════════════

header("EXISTING MODELS (5)");

// 1a — GCS from AVPU
runTest("GCS — deriveGCSFromAVPU('Alert')", () => {
  const score = deriveGCSFromAVPU("Alert");
  if (score !== 15) throw new Error(`Expected 15, got ${score}`);
  return { avpu: "Alert", gcsScore: score };
});

runTest("GCS — deriveGCSFromAVPU('Pain')", () => {
  const score = deriveGCSFromAVPU("Pain");
  if (score !== 8) throw new Error(`Expected 8, got ${score}`);
  return { avpu: "Pain", gcsScore: score };
});

// 1b — Full GCS
runTest("GCS — calculateGCS (normal)", () => {
  return calculateGCS({ eyeOpening: 4, verbalResponse: 5, motorResponse: 6 });
});

runTest("GCS — calculateGCS (severe)", () => {
  return calculateGCS({ eyeOpening: 1, verbalResponse: 1, motorResponse: 3 });
});

// 2 — MEWS
runTest("MEWS — normal vitals", () => {
  return calculateMEWS({
    heartRate: 75,
    systolic: 120,
    respiratoryRate: 16,
    temperature: 37.0,
    consciousness: "Alert",
  });
});

runTest("MEWS — critical vitals", () => {
  return calculateMEWS({
    heartRate: 140,
    systolic: 65,
    respiratoryRate: 35,
    temperature: 39.5,
    consciousness: "Unresponsive",
  });
});

// 3 — Shock Index
runTest("Shock Index — normal (HR 70, SBP 120)", () => {
  return calculateShockIndex({ heartRate: 70, systolic: 120 });
});

runTest("Shock Index — shock (HR 130, SBP 80)", () => {
  return calculateShockIndex({ heartRate: 130, systolic: 80 });
});

// 4 — RTS
runTest("RTS — normal", () => {
  return calculateRTS({ gcsScore: 15, systolic: 120, respiratoryRate: 16 });
});

runTest("RTS — critical trauma", () => {
  return calculateRTS({ gcsScore: 5, systolic: 40, respiratoryRate: 4 });
});

// 5 — Simplified SOFA
runTest("SOFA — normal", () => {
  return calculateSimplifiedSOFA({
    oxygenSat: 98,
    systolic: 120,
    diastolic: 80,
    gcsScore: 15,
  });
});

runTest("SOFA — organ failure", () => {
  return calculateSimplifiedSOFA({
    oxygenSat: 82,
    systolic: 60,
    diastolic: 35,
    gcsScore: 6,
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. New Models (9)
// ═══════════════════════════════════════════════════════════════

header("NEW MODELS (9)");

// 6 — NEWS2
runTest("NEWS2 — normal vitals (no supplemental O2)", () => {
  return calculateNEWS2({
    respiratoryRate: 16,
    oxygenSat: 97,
    onSupplementalOxygen: false,
    systolic: 120,
    heartRate: 72,
    consciousness: "Alert",
    temperature: 37.0,
  });
});

runTest("NEWS2 — high risk (on supplemental O2)", () => {
  return calculateNEWS2({
    respiratoryRate: 28,
    oxygenSat: 85,
    onSupplementalOxygen: true,
    systolic: 88,
    heartRate: 135,
    consciousness: "Voice",
    temperature: 39.5,
  });
});

runTest("NEWS2 — medium risk", () => {
  return calculateNEWS2({
    respiratoryRate: 22,
    oxygenSat: 93,
    onSupplementalOxygen: false,
    systolic: 105,
    heartRate: 95,
    consciousness: "Alert",
    temperature: 38.5,
  });
});

// 7 — Modified Shock Index
runTest("MSI — normal (HR 70, SBP 120, DBP 80)", () => {
  return calculateMSI({ heartRate: 70, systolic: 120, diastolic: 80 });
});

runTest("MSI — shock risk (HR 130, SBP 80, DBP 50)", () => {
  return calculateMSI({ heartRate: 130, systolic: 80, diastolic: 50 });
});

runTest("MSI — severe shock (HR 150, SBP 60, DBP 30)", () => {
  return calculateMSI({ heartRate: 150, systolic: 60, diastolic: 30 });
});

// 8 — qSOFA
runTest("qSOFA — low risk (normal vitals)", () => {
  return calculateQSOFA({
    respiratoryRate: 16,
    systolic: 120,
    consciousness: "Alert",
  });
});

runTest("qSOFA — sepsis risk (2/3 criteria met)", () => {
  return calculateQSOFA({
    respiratoryRate: 24,
    systolic: 90,
    consciousness: "Alert",
  });
});

runTest("qSOFA — high risk (3/3 criteria met)", () => {
  return calculateQSOFA({
    respiratoryRate: 28,
    systolic: 85,
    consciousness: "Voice",
  });
});

// 9 — PRESEP
runTest("PRESEP — low risk (young, normal vitals)", () => {
  return calculatePRESEP({
    age: 35,
    heartRate: 80,
    respiratoryRate: 16,
    systolic: 120,
    oxygenSat: 98,
    temperature: 37.0,
    nursingHomeResident: false,
  });
});

runTest("PRESEP — high risk (elderly nursing home resident, abnormal vitals)", () => {
  return calculatePRESEP({
    age: 78,
    heartRate: 130,
    respiratoryRate: 28,
    systolic: 88,
    oxygenSat: 91,
    temperature: 39.0,
    nursingHomeResident: true,
  });
});

// 10 — Pulse Pressure
runTest("Pulse Pressure — normal (120/80)", () => {
  return calculatePulsePressure({ systolic: 120, diastolic: 80 });
});

runTest("Pulse Pressure — narrow (90/75 → tamponade risk)", () => {
  return calculatePulsePressure({ systolic: 90, diastolic: 75 });
});

runTest("Pulse Pressure — wide (180/60)", () => {
  return calculatePulsePressure({ systolic: 180, diastolic: 60 });
});

// 11 — CPSS (Stroke)
runTest("CPSS — no stroke signs", () => {
  return calculateCPSS({
    facialDroop: false,
    armDrift: false,
    speechAbnormality: false,
  });
});

runTest("CPSS — positive stroke screen (2/3 signs)", () => {
  return calculateCPSS({
    facialDroop: true,
    armDrift: true,
    speechAbnormality: false,
  });
});

runTest("CPSS — all 3 signs present", () => {
  return calculateCPSS({
    facialDroop: true,
    armDrift: true,
    speechAbnormality: true,
  });
});

// 12 — CRB-65
runTest("CRB65 — low risk (young, normal vitals)", () => {
  return calculateCRB65({
    consciousness: "Alert",
    respiratoryRate: 18,
    systolic: 120,
    diastolic: 80,
    age: 40,
  });
});

runTest("CRB65 — moderate risk", () => {
  return calculateCRB65({
    consciousness: "Voice",
    respiratoryRate: 25,
    systolic: 100,
    diastolic: 65,
    age: 50,
  });
});

runTest("CRB65 — high risk (severe pneumonia)", () => {
  return calculateCRB65({
    consciousness: "Pain",
    respiratoryRate: 35,
    systolic: 85,
    diastolic: 55,
    age: 72,
  });
});

// 13 — PAT (Pediatric)
runTest("PAT — not applicable (adult, age 30)", () => {
  return calculatePAT({
    age: 30,
    heartRate: 80,
    respiratoryRate: 16,
    oxygenSat: 98,
    consciousness: "Alert",
  });
});

runTest("PAT — normal infant (age 0.5, HR 130, RR 40)", () => {
  return calculatePAT({
    age: 0.5,
    heartRate: 130,
    respiratoryRate: 40,
    oxygenSat: 97,
    consciousness: "Alert",
  });
});

runTest("PAT — critical toddler (age 2, tachycardic, low SpO2)", () => {
  return calculatePAT({
    age: 2,
    heartRate: 200,
    respiratoryRate: 50,
    oxygenSat: 85,
    consciousness: "Pain",
  });
});

runTest("PAT — school-age child with abnormal vitals", () => {
  return calculatePAT({
    age: 8,
    heartRate: 140,
    respiratoryRate: 35,
    oxygenSat: 92,
    consciousness: "Voice",
  });
});

// 14 — START Triage
runTest("START — MINIMAL (all normal, Alert)", () => {
  return calculateSTART({
    respiratoryRate: 16,
    heartRate: 75,
    consciousness: "Alert",
  });
});

runTest("START — DELAYED (Alert, slight tachycardia)", () => {
  return calculateSTART({
    respiratoryRate: 22,
    heartRate: 110,
    consciousness: "Alert",
  });
});

runTest("START — IMMEDIATE (RR > 30)", () => {
  return calculateSTART({
    respiratoryRate: 35,
    heartRate: 100,
    consciousness: "Alert",
  });
});

runTest("START — IMMEDIATE (Unresponsive)", () => {
  return calculateSTART({
    respiratoryRate: 20,
    heartRate: 80,
    consciousness: "Unresponsive",
  });
});

runTest("START — DECEASED (RR = 0)", () => {
  return calculateSTART({
    respiratoryRate: 0,
    heartRate: 0,
    consciousness: "Unresponsive",
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. Severity Aggregator (integrated — all 14 models)
// ═══════════════════════════════════════════════════════════════

header("SEVERITY AGGREGATOR (all 14 models integrated)");

runTest("Aggregator — stable patient (normal vitals)", () => {
  return calculateSeverity({
    heartRate: 75,
    systolic: 120,
    diastolic: 80,
    respiratoryRate: 16,
    temperature: 37.0,
    oxygenSat: 98,
    consciousness: "Alert",
    age: 35,
    conditions: [],
    onSupplementalOxygen: false,
    facialDroop: false,
    armDrift: false,
    speechAbnormality: false,
    nursingHomeResident: false,
  });
});

runTest("Aggregator — critical stroke patient", () => {
  return calculateSeverity({
    heartRate: 100,
    systolic: 170,
    diastolic: 95,
    respiratoryRate: 20,
    temperature: 37.2,
    oxygenSat: 95,
    consciousness: "Voice",
    age: 68,
    conditions: ["Hypertension"],
    onSupplementalOxygen: false,
    facialDroop: true,
    armDrift: true,
    speechAbnormality: true,
    nursingHomeResident: false,
  });
});

runTest("Aggregator — sepsis suspect (elderly nursing home)", () => {
  return calculateSeverity({
    heartRate: 130,
    systolic: 88,
    diastolic: 50,
    respiratoryRate: 26,
    temperature: 39.2,
    oxygenSat: 91,
    consciousness: "Voice",
    age: 82,
    conditions: ["Diabetes"],
    onSupplementalOxygen: true,
    facialDroop: false,
    armDrift: false,
    speechAbnormality: false,
    nursingHomeResident: true,
  });
});

runTest("Aggregator — pediatric critical (toddler)", () => {
  return calculateSeverity({
    heartRate: 200,
    systolic: 70,
    diastolic: 40,
    respiratoryRate: 50,
    temperature: 39.5,
    oxygenSat: 84,
    consciousness: "Pain",
    age: 2,
    conditions: [],
    onSupplementalOxygen: true,
    facialDroop: false,
    armDrift: false,
    speechAbnormality: false,
    nursingHomeResident: false,
  });
});

runTest("Aggregator — mass casualty IMMEDIATE triage", () => {
  return calculateSeverity({
    heartRate: 0,
    systolic: 60,
    diastolic: 30,
    respiratoryRate: 35,
    temperature: 36.0,
    oxygenSat: 80,
    consciousness: "Unresponsive",
    age: 45,
    conditions: [],
    onSupplementalOxygen: false,
    facialDroop: false,
    armDrift: false,
    speechAbnormality: false,
    nursingHomeResident: false,
  });
});

runTest("Aggregator — cardiac tamponade risk (narrow pulse pressure)", () => {
  return calculateSeverity({
    heartRate: 120,
    systolic: 90,
    diastolic: 78,
    respiratoryRate: 24,
    temperature: 36.8,
    oxygenSat: 93,
    consciousness: "Alert",
    age: 55,
    conditions: ["Heart Disease"],
    onSupplementalOxygen: false,
    facialDroop: false,
    armDrift: false,
    speechAbnormality: false,
    nursingHomeResident: false,
  });
});

// ═══════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════

header("TEST SUMMARY");
console.log(`  Total:  ${passed + failed}`);
console.log(`  Passed: ${passed} ✅`);
console.log(`  Failed: ${failed} ❌`);
console.log("═".repeat(60));

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\n🎉 All models executed successfully!\n");
  process.exit(0);
}
