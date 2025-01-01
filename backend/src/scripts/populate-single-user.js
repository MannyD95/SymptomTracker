import { Sequelize, Op } from 'sequelize';
import { User, Symptom, SymptomEntry } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const USERNAME = 'testuser_1735704455115';

async function addRecentEntries() {
    try {
        // Get the user
        const user = await User.findOne({
            where: { username: USERNAME }
        });

        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        // Get all symptoms
        const symptoms = await Symptom.findAll();
        if (symptoms.length === 0) {
            console.error('No symptoms found');
            process.exit(1);
        }

        // Create entries for the last 24 hours
        const now = new Date();
        const entry = await SymptomEntry.create({
            userId: user.id,
            date: now
        });

        // Add 2-3 random symptoms
        const numSymptoms = 2 + Math.floor(Math.random() * 2);
        const shuffled = [...symptoms].sort(() => 0.5 - Math.random());
        const selectedSymptoms = shuffled.slice(0, numSymptoms);
        
        await entry.addSymptoms(selectedSymptoms);

        console.log(`Added ${numSymptoms} symptoms for ${USERNAME} at ${now.toISOString()}`);
        console.log('Symptoms:', selectedSymptoms.map(s => s.name).join(', '));
        process.exit(0);
    } catch (error) {
        console.error('Error adding entries:', error);
        process.exit(1);
    }
}

addRecentEntries(); 