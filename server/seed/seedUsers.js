const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' }); // Ensure dotenv targets the right path for connection

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mediroute');
        console.log('Connected to MongoDB for seeding.');

        // Clear existing test users
        await User.deleteMany({ email: { $in: ['public@mediroute.com', 'ambulance@mediroute.com', 'hospital@mediroute.com', 'admin@mediroute.com'] } });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('pass123', salt);

        const usersToSeed = [
            { name: 'Test Public User', email: 'public@mediroute.com', password: hashedPassword, role: 'public', phone: '1234567890' },
            { name: 'Test Ambulance Driver', email: 'ambulance@mediroute.com', password: hashedPassword, role: 'ambulance', phone: '2345678901' },
            { name: 'Test Hospital Staff', email: 'hospital@mediroute.com', password: hashedPassword, role: 'hospital', phone: '3456789012' },
            { name: 'Test Administrator', email: 'admin@mediroute.com', password: hashedPassword, role: 'admin', phone: '4567890123' }
        ];

        await User.insertMany(usersToSeed);

        console.log('\n--- Seed Users Created Successfully ---\n');
        console.log('Login Credentials for Demo:');
        usersToSeed.forEach(user => {
            console.log(`${user.role.toUpperCase()}:`);
            console.log(`Email: ${user.email}`);
            console.log(`Password: pass123`);
            console.log('---------------------------');
        });

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
