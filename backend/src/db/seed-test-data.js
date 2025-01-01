const { User, Symptom, SymptomEntry } = require('../models');
const bcrypt = require('bcrypt');

async function seedTestData() {
    try {
        // Create test users with locations
        const testUsers = [
            {
                username: 'test1',
                email: 'test1@example.com',
                password: 'password123',
                latitude: 40.7128,  // New York
                longitude: -74.0060
            },
            {
                username: 'test2',
                email: 'test2@example.com',
                password: 'password123',
                latitude: 40.7142,  // Also New York, slightly different location
                longitude: -74.0064
            },
            {
                username: 'test3',
                email: 'test3@example.com',
                password: 'password123',
                latitude: 40.7135,  // Another New York location
                longitude: -74.0062
            }
        ];

        // Create users
        const createdUsers = await Promise.all(testUsers.map(async user => {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            return User.create({
                ...user,
                password: hashedPassword
            });
        }));

        // Get all symptoms
        const symptoms = await Symptom.findAll();
        if (symptoms.length === 0) {
            console.error('No symptoms found in database. Please run seed-symptoms.js first.');
            return;
        }

        // Create symptom entries for the past week
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        for (const user of createdUsers) {
            // Create 3-4 entries for each user over the past week
            for (let i = 0; i < 4; i++) {
                const entryDate = new Date(
                    oneWeekAgo.getTime() + 
                    Math.random() * (now.getTime() - oneWeekAgo.getTime())
                );

                // Create entry
                const entry = await SymptomEntry.create({
                    userId: user.id,
                    date: entryDate
                });

                // Add 2-3 random symptoms to each entry
                const numSymptoms = Math.floor(Math.random() * 2) + 2;
                const randomSymptoms = symptoms
                    .sort(() => 0.5 - Math.random())
                    .slice(0, numSymptoms);

                await entry.addSymptoms(randomSymptoms);
            }
        }

        console.log('Test data seeded successfully');
    } catch (error) {
        console.error('Error seeding test data:', error);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    seedTestData();
}

module.exports = { seedTestData };
