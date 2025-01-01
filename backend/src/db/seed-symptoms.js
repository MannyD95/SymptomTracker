import { Symptom } from '../models/Symptom.js';

const symptoms = [
    { name: 'Body aches' },
    { name: 'Chest tightness' },
    { name: 'Coughing' },
    { name: 'Diarrhea' },
    { name: 'Fatigue' },
    { name: 'Fever' },
    { name: 'Headache' },
    { name: 'Hives' },
    { name: 'Itchy eyes' },
    { name: 'Itchy nose' },
    { name: 'Lightheadedness' },
    { name: 'Nausea' },
    { name: 'Rash' },
    { name: 'Runny nose' },
    { name: 'Shortness of breath' },
    { name: 'Sneezing' },
    { name: 'Sore throat' },
    { name: 'Stomach cramps' },
    { name: 'Throat tightness' },
    { name: 'Tongue swelling' },
    { name: 'Vomiting' },
    { name: 'Watery eyes' },
    { name: 'Wheezing' }
];

async function seedSymptoms() {
    try {
        // Delete existing symptoms
        await Symptom.destroy({ where: {} });
        
        // Insert new symptoms
        await Symptom.bulkCreate(symptoms);
        
        console.log('Symptoms seeded successfully');
    } catch (error) {
        console.error('Error seeding symptoms:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    seedSymptoms();
}

export { seedSymptoms }; 