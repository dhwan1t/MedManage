/**
 * seedUsers.js
 *
 * Users are now seeded together with all other data in seedData.js
 * to ensure proper linking between users, ambulances, and hospitals.
 *
 * Run: npm run seed   (which executes seedData.js)
 *
 * This file is kept for backwards compatibility — it simply delegates
 * to the unified seed script.
 */

console.log("Users are now seeded via seedData.js (unified seed script).");
console.log("Running seedData.js instead...\n");

require("./seedData");
