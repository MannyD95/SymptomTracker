import { Sequelize, Op } from 'sequelize';
import { User, Symptom, SymptomEntry } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const BOSTON_LAT = 42.3601;
const BOSTON_LNG = -71.0589;
const RADIUS_KM = 15;

// Function to generate random coordinates within radius of Boston
function generateRandomLocation() {
    // Convert radius from km to degrees (approximately)
    const radiusLat = RADIUS_KM / 111.32;
    const radiusLng = RADIUS_KM / (111.32 * Math.cos(BOSTON_LAT * (Math.PI / 180)));

    const randomLat = BOSTON_LAT + (Math.random() * 2 - 1) * radiusLat;
    const randomLng = BOSTON_LNG + (Math.random() * 2 - 1) * radiusLng;

    return {
        latitude: randomLat.toFixed(8),
        longitude: randomLng.toFixed(8)
    };
}

async function createTestData() {
    try {
        // Create test symptoms if they don't exist
        const symptoms = await Promise.all([
            Symptom.findOrCreate({ where: { name: 'Cough' } }),
            Symptom.findOrCreate({ where: { name: 'Fever' } }),
            Symptom.findOrCreate({ where: { name: 'Headache' } }),
            Symptom.findOrCreate({ where: { name: 'Sore Throat' } }),
            Symptom.findOrCreate({ where: { name: 'Fatigue' } }),
            Symptom.findOrCreate({ where: { name: 'Runny Nose' } }),
            Symptom.findOrCreate({ where: { name: 'Body Aches' } }),
            Symptom.findOrCreate({ where: { name: 'Nausea' } })
        ]);

        const allSymptoms = symptoms.map(([symptom]) => symptom);

        // Create test users with random locations in Boston area
        const numUsers = 30;
        const users = [];
        
        for (let i = 0; i < numUsers; i++) {
            const location = generateRandomLocation();
            const timestamp = Date.now();
            const user = await User.create({
                username: `testuser_${timestamp}`,
                email: `testuser_${timestamp}@example.com`,
                password: 'testpassword',
                latitude: location.latitude,
                longitude: location.longitude
            });
            users.push(user);
        }

        // Create symptom entries for the past 30 days
        const now = new Date();
        for (const user of users) {
            // Random number of entries (between 5 and 15)
            const numEntries = 5 + Math.floor(Math.random() * 11);
            
            for (let i = 0; i < numEntries; i++) {
                // Random date within past 30 days
                const date = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000);
                
                // Create entry
                const entry = await SymptomEntry.create({
                    userId: user.id,
                    date
                });

                // Add random symptoms (1-4 symptoms per entry)
                const numSymptoms = 1 + Math.floor(Math.random() * 4);
                const shuffled = [...allSymptoms].sort(() => 0.5 - Math.random());
                const selectedSymptoms = shuffled.slice(0, numSymptoms);
                
                await entry.addSymptoms(selectedSymptoms);
            }
        }

        console.log('Test data created successfully!');
        console.log(`Created ${users.length} users with random symptom entries.`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating test data:', error);
        process.exit(1);
    }
}

createTestData();