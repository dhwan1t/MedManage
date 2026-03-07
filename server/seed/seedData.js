const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');
const Alert = require('../models/Alert');
const Case = require('../models/Case');
const Patient = require('../models/Patient');
const User = require('../models/User');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mediroute');
        console.log('Connected to MongoDB for seeding data...');

        // Clear existing main collections
        await Hospital.deleteMany({});
        await Ambulance.deleteMany({});
        await Alert.deleteMany({});
        // keeping cases and patients, but for a clean slate, you'd delete them too
        // await Case.deleteMany({});
        // await Patient.deleteMany({});

        // 1. Seed Hospitals
        const hospitals = [
            {
                name: 'City Medical Center',
                type: 'govt',
                location: { lat: 30.9, lng: 75.85, address: 'Ludhiana' },
                resources: {
                    generalBeds: { total: 100, available: 40 },
                    icuBeds: { total: 20, available: 5 },
                    otTheatres: { total: 5, available: 2 },
                    erBays: { total: 10, available: 8 }
                },
                status: 'accepting'
            },
            {
                name: 'PGIMER Annex',
                type: 'govt',
                location: { lat: 30.91, lng: 75.86, address: 'Ludhiana' },
                resources: {
                    generalBeds: { total: 150, available: 20 },
                    icuBeds: { total: 30, available: 0 },
                    otTheatres: { total: 8, available: 1 },
                    erBays: { total: 15, available: 2 }
                },
                status: 'at_capacity' // ICU full
            },
            {
                name: 'Apollo Ludhiana',
                type: 'private',
                location: { lat: 30.89, lng: 75.84, address: 'Ludhiana' },
                resources: {
                    generalBeds: { total: 50, available: 45 },
                    icuBeds: { total: 15, available: 12 },
                    otTheatres: { total: 4, available: 4 },
                    erBays: { total: 5, available: 4 }
                },
                status: 'accepting'
            },
            {
                name: 'Civil Hospital',
                type: 'govt',
                location: { lat: 30.88, lng: 75.83, address: 'Ludhiana' },
                resources: {
                    generalBeds: { total: 200, available: 2 },
                    icuBeds: { total: 40, available: 0 },
                    otTheatres: { total: 10, available: 0 },
                    erBays: { total: 20, available: 1 }
                },
                status: 'at_capacity'
            },
            {
                name: 'Max Super Speciality',
                type: 'private',
                location: { lat: 30.92, lng: 75.87, address: 'Ludhiana' },
                resources: {
                    generalBeds: { total: 80, available: 30 },
                    icuBeds: { total: 25, available: 5 },
                    otTheatres: { total: 6, available: 3 },
                    erBays: { total: 8, available: 4 }
                },
                status: 'accepting'
            }
        ];
        await Hospital.insertMany(hospitals);
        console.log('✅ Hospitals seeded');

        // 2. Seed Ambulances
        const ambulances = [
            { ambulanceId: 'AMB-2047', status: 'available', currentLocation: { lat: 30.905, lng: 75.855 } },
            { ambulanceId: 'AMB-1023', status: 'on_call', currentLocation: { lat: 30.895, lng: 75.845 } },
            { ambulanceId: 'AMB-3301', status: 'available', currentLocation: { lat: 30.885, lng: 75.835 } }
        ];
        await Ambulance.insertMany(ambulances);
        console.log('✅ Ambulances seeded');

        // 3. Seed Alerts
        const alerts = [
            { type: 'disease', title: 'Dengue Outbreak Warning', message: 'High number of Dengue cases reported in central zones.', severity: 'high', city: 'Ludhiana', active: true },
            { type: 'emergency', title: 'Traffic Accident on NH44', message: 'Major collision causing delays. Ambulances rerouted.', severity: 'medium', city: 'Ludhiana', active: true },
            { type: 'disease', title: 'Seasonal Flu Advisory', message: 'Increase in flu symptoms. Stock up on paracetamol.', severity: 'low', city: 'Ludhiana', active: true }
        ];
        await Alert.insertMany(alerts);
        console.log('✅ Alerts seeded');

        console.log('\nSeed complete');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
