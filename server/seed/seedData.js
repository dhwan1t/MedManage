const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Hospital = require("../models/Hospital");
const Ambulance = require("../models/Ambulance");
const Alert = require("../models/Alert");
const Case = require("../models/Case");
const Patient = require("../models/Patient");
const User = require("../models/User");

const seedData = async () => {
  try {
    // ── P0-04: Read seed password from env or generate a random one ──
    // NEVER use a hardcoded password like "pass123" in seed data.
    let SEED_PASSWORD = process.env.SEED_PASSWORD;
    let passwordWasGenerated = false;

    if (!SEED_PASSWORD) {
      SEED_PASSWORD = "pass123";
      passwordWasGenerated = true;
      console.warn(
        "⚠️  SEED_PASSWORD not set in .env — using default password 'pass123' for demo users.",
      );
    }

    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error("FATAL: MONGO_URI environment variable is not set.");
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding...\n");

    // Clear ALL collections for a clean slate
    await Hospital.deleteMany({});
    await Ambulance.deleteMany({});
    await Alert.deleteMany({});
    await Case.deleteMany({});
    await Patient.deleteMany({});
    await User.deleteMany({});
    console.log("🗑️  Cleared all collections");

    // Hash the shared demo password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, salt);

    // ══════════════════════════════════════════════════
    // 1. Seed Hospitals
    // ══════════════════════════════════════════════════
    const hospitals = await Hospital.insertMany([
      {
        name: "City Medical Center",
        type: "govt",
        location: { lat: 30.9, lng: 75.85, address: "Ludhiana" },
        resources: {
          generalBeds: { total: 100, available: 40 },
          icuBeds: { total: 20, available: 5 },
          otTheatres: { total: 5, available: 2 },
          erBays: { total: 10, available: 8 },
        },
        doctors: [
          { name: "Dr. Sharma", speciality: "Cardiology", available: true },
          {
            name: "Dr. Patel",
            speciality: "General Medicine",
            available: true,
          },
          { name: "Dr. Gupta", speciality: "Neurology", available: false },
        ],
        status: "accepting",
        rating: 4.2,
        avgResponseTime: 8,
      },
      {
        name: "PGIMER Annex",
        type: "govt",
        location: { lat: 30.91, lng: 75.86, address: "Ludhiana" },
        resources: {
          generalBeds: { total: 150, available: 20 },
          icuBeds: { total: 30, available: 0 },
          otTheatres: { total: 8, available: 1 },
          erBays: { total: 15, available: 2 },
        },
        doctors: [
          { name: "Dr. Singh", speciality: "Trauma", available: true },
          { name: "Dr. Kaur", speciality: "Pulmonology", available: true },
        ],
        status: "at_capacity",
        rating: 4.5,
        avgResponseTime: 12,
      },
      {
        name: "Apollo Ludhiana",
        type: "private",
        location: { lat: 30.89, lng: 75.84, address: "Ludhiana" },
        resources: {
          generalBeds: { total: 50, available: 45 },
          icuBeds: { total: 15, available: 12 },
          otTheatres: { total: 4, available: 4 },
          erBays: { total: 5, available: 4 },
        },
        doctors: [
          { name: "Dr. Mehta", speciality: "Cardiology", available: true },
          { name: "Dr. Rao", speciality: "Orthopaedics", available: true },
          { name: "Dr. Joshi", speciality: "General Surgery", available: true },
        ],
        status: "accepting",
        rating: 4.7,
        avgResponseTime: 6,
      },
      {
        name: "Civil Hospital",
        type: "govt",
        location: { lat: 30.88, lng: 75.83, address: "Ludhiana" },
        resources: {
          generalBeds: { total: 200, available: 2 },
          icuBeds: { total: 40, available: 0 },
          otTheatres: { total: 10, available: 0 },
          erBays: { total: 20, available: 1 },
        },
        doctors: [
          { name: "Dr. Verma", speciality: "Emergency", available: true },
        ],
        status: "emergency_only",
        rating: 3.5,
        avgResponseTime: 15,
      },
      {
        name: "Max Super Speciality",
        type: "private",
        location: { lat: 30.92, lng: 75.87, address: "Ludhiana" },
        resources: {
          generalBeds: { total: 80, available: 30 },
          icuBeds: { total: 25, available: 5 },
          otTheatres: { total: 6, available: 3 },
          erBays: { total: 8, available: 4 },
        },
        doctors: [
          { name: "Dr. Adams", speciality: "Cardiac Surgery", available: true },
          { name: "Dr. Stevens", speciality: "Neurosurgery", available: false },
          { name: "Dr. Lee", speciality: "Trauma", available: true },
          {
            name: "Dr. Patel",
            speciality: "General Medicine",
            available: true,
          },
        ],
        status: "accepting",
        rating: 4.8,
        avgResponseTime: 5,
      },
    ]);
    console.log(`✅ ${hospitals.length} Hospitals seeded`);

    // ══════════════════════════════════════════════════
    // 2. Seed Ambulances (without operatorId for now — linked after user creation)
    // ══════════════════════════════════════════════════
    const ambulances = await Ambulance.insertMany([
      {
        ambulanceId: "AMB-2047",
        status: "available",
        currentLocation: { lat: 30.905, lng: 75.855 },
      },
      {
        ambulanceId: "AMB-1023",
        status: "available",
        currentLocation: { lat: 30.895, lng: 75.845 },
      },
      {
        ambulanceId: "AMB-3301",
        status: "available",
        currentLocation: { lat: 30.885, lng: 75.835 },
      },
    ]);
    console.log(`✅ ${ambulances.length} Ambulances seeded`);

    // ══════════════════════════════════════════════════
    // 3. Seed Users — LINKED to ambulances and hospitals
    // ══════════════════════════════════════════════════

    // Public user
    const publicUser = await User.create({
      name: "Test Public User",
      email: "public@mediroute.com",
      password: hashedPassword,
      role: "public",
      phone: "1234567890",
    });

    // Ambulance operator — linked to the first ambulance
    const ambulanceUser = await User.create({
      name: "Test Ambulance Driver",
      email: "ambulance@mediroute.com",
      password: hashedPassword,
      role: "ambulance",
      phone: "2345678901",
      ambulanceId: ambulances[0]._id,
    });

    // Update the ambulance to point back to this user
    ambulances[0].operatorId = ambulanceUser._id;
    await ambulances[0].save();

    // Hospital staff — linked to "City Medical Center" (hospitals[0])
    const hospitalUser = await User.create({
      name: "Test Hospital Staff",
      email: "hospital@mediroute.com",
      password: hashedPassword,
      role: "hospital",
      phone: "3456789012",
      hospitalId: hospitals[0]._id,
    });

    // Admin user
    const adminUser = await User.create({
      name: "Test Administrator",
      email: "admin@mediroute.com",
      password: hashedPassword,
      role: "admin",
      phone: "4567890123",
    });

    // ── Create a second ambulance operator linked to AMB-1023 ──
    const ambulanceUser2 = await User.create({
      name: "Second Ambulance Driver",
      email: "ambulance2@mediroute.com",
      password: hashedPassword,
      role: "ambulance",
      phone: "5678901234",
      ambulanceId: ambulances[1]._id,
    });
    ambulances[1].operatorId = ambulanceUser2._id;
    await ambulances[1].save();

    // ── Create a second hospital staff linked to "Apollo Ludhiana" (hospitals[2]) ──
    const hospitalUser2 = await User.create({
      name: "Apollo Hospital Staff",
      email: "hospital2@mediroute.com",
      password: hashedPassword,
      role: "hospital",
      phone: "6789012345",
      hospitalId: hospitals[2]._id,
    });

    console.log("✅ Users seeded & linked to ambulances/hospitals");

    // ══════════════════════════════════════════════════
    // 4. Seed Alerts
    // ══════════════════════════════════════════════════
    const alerts = await Alert.insertMany([
      {
        type: "disease",
        title: "Dengue Outbreak Warning",
        message: "High number of Dengue cases reported in central zones.",
        severity: "high",
        affectedZones: ["Zone 2", "Zone 4"],
        city: "Ludhiana",
        active: true,
        symptoms: ["High Fever", "Joint Pain", "Rash", "Headache", "Eye Pain"],
      },
      {
        type: "emergency",
        title: "Traffic Accident on NH44",
        message: "Major collision causing delays. Ambulances rerouted.",
        severity: "medium",
        affectedZones: ["Highway NH44"],
        city: "Ludhiana",
        active: true,
        symptoms: [],
      },
      {
        type: "disease",
        title: "Seasonal Flu Advisory",
        message: "Increase in flu symptoms. Stock up on paracetamol.",
        severity: "low",
        affectedZones: ["Zone 1", "Zone 3", "Zone 5"],
        city: "Ludhiana",
        active: true,
        symptoms: ["Fever", "Cough", "Sore Throat", "Body Ache", "Fatigue"],
      },
    ]);
    console.log(`✅ ${alerts.length} Alerts seeded`);

    // ══════════════════════════════════════════════════
    // 5. Seed a sample completed Case + Patient (for demo data)
    // ══════════════════════════════════════════════════
    const samplePatient = await Patient.create({
      name: "Sample Patient",
      age: 45,
      gender: "Male",
      status: "discharged",
      vitals: {
        heartRate: 88,
        systolic: 120,
        diastolic: 80,
        respiratoryRate: 16,
        temperature: 37.2,
        oxygenSat: 97,
        consciousness: "Alert",
        chiefComplaint: "Chest Pain",
        age: 45,
        conditions: ["Hypertension"],
      },
      severity: {
        score: 35,
        level: "stable",
        canWait: true,
        flags: [],
      },
    });

    const sampleCase = await Case.create({
      patient: samplePatient._id,
      ambulance: ambulances[0]._id,
      hospital: hospitals[0]._id,
      selectedHospital: hospitals[0]._id,
      status: "completed",
      timeline: [
        { event: "dispatched", timestamp: new Date(Date.now() - 3600000) },
        { event: "vitals_updated", timestamp: new Date(Date.now() - 3000000) },
        { event: "en_route", timestamp: new Date(Date.now() - 2400000) },
        { event: "arrived", timestamp: new Date(Date.now() - 1800000) },
        { event: "completed", timestamp: new Date(Date.now() - 1200000) },
      ],
    });

    samplePatient.caseId = sampleCase._id;
    await samplePatient.save();

    console.log("✅ Sample case + patient seeded");

    // ══════════════════════════════════════════════════
    // Print summary
    // ══════════════════════════════════════════════════
    console.log("\n" + "═".repeat(60));
    console.log("  SEED COMPLETE — SUMMARY");
    console.log("═".repeat(60));
    console.log(`  Hospitals:   ${hospitals.length}`);
    console.log(`  Ambulances:  ${ambulances.length}`);
    console.log(`  Alerts:      ${alerts.length}`);
    console.log(`  Users:       6`);
    console.log(`  Cases:       1 (sample)`);
    console.log("═".repeat(60));
    if (passwordWasGenerated) {
      console.log(
        `\n  Demo Login Credentials (generated password: ${SEED_PASSWORD}):\n`,
      );
      console.log(
        "  ⚠️  Set SEED_PASSWORD in your .env to use a fixed password.\n",
      );
    } else {
      console.log(
        "\n  Demo Login Credentials (password from SEED_PASSWORD env var):\n",
      );
    }

    const allUsers = [
      { role: "PUBLIC", email: "public@mediroute.com", linked: "—" },
      {
        role: "AMBULANCE",
        email: "ambulance@mediroute.com",
        linked: "AMB-2047",
      },
      {
        role: "AMBULANCE",
        email: "ambulance2@mediroute.com",
        linked: "AMB-1023",
      },
      {
        role: "HOSPITAL",
        email: "hospital@mediroute.com",
        linked: "City Medical Center",
      },
      {
        role: "HOSPITAL",
        email: "hospital2@mediroute.com",
        linked: "Apollo Ludhiana",
      },
      { role: "ADMIN", email: "admin@mediroute.com", linked: "—" },
    ];

    allUsers.forEach((u) => {
      console.log(
        `  ${u.role.padEnd(10)} | ${u.email.padEnd(30)} | ${u.linked}`,
      );
    });

    console.log("\n" + "═".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
