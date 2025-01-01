import express from 'express';
import { Sequelize, Op } from 'sequelize';
import { Symptom, SymptomEntry, User } from '../models/index.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all available symptoms (protected)
router.get('/', auth, async (req, res) => {
    try {
        const symptoms = await Symptom.findAll({
            order: [['name', 'ASC']]
        });
        res.json(symptoms);
    } catch (error) {
        console.error('Error fetching symptoms:', error);
        res.status(500).json({ error: 'Failed to fetch symptoms' });
    }
});

// Log symptoms for a user
router.post('/entry', auth, async (req, res) => {
    try {
        const { symptoms, date } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!Array.isArray(symptoms)) {
            return res.status(400).json({ 
                error: 'Invalid request',
                details: 'Symptoms must be an array'
            });
        }

        // Parse the date in UTC
        const entryDate = date ? new Date(date) : new Date();
        
        if (isNaN(entryDate.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format',
                details: 'Please provide a valid date'
            });
        }
        
        // Create a UTC date at the start of the day
        const utcDate = new Date(Date.UTC(
            entryDate.getUTCFullYear(),
            entryDate.getUTCMonth(),
            entryDate.getUTCDate()
        ));

        // Find or create entry for this date
        let [entry] = await SymptomEntry.findOrCreate({
            where: {
                userId,
                date: utcDate
            },
            defaults: {
                userId,
                date: utcDate
            }
        });

        // Clear existing symptoms for this entry
        await entry.setSymptoms([]);

        // Add new symptoms if any
        if (symptoms && symptoms.length > 0) {
            const symptomIds = symptoms.map(s => s.id);
            await entry.addSymptoms(symptomIds);
        }

        // Fetch the updated entry with symptoms
        const updatedEntry = await SymptomEntry.findOne({
            where: { id: entry.id },
            include: [{
                model: Symptom,
                as: 'symptoms',
                through: { attributes: [] }
            }]
        });

        res.json({
            message: 'Symptoms logged successfully',
            entry: updatedEntry
        });
    } catch (error) {
        console.error('Error logging symptoms:', error);
        res.status(500).json({ 
            error: 'Failed to log symptoms',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get symptom history for a user
router.get('/history', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const entries = await SymptomEntry.findAll({
            where: { userId },
            include: [{
                model: Symptom,
                as: 'symptoms',
                through: { attributes: [] }
            }],
            order: [['date', 'DESC']]
        });

        res.json(entries);
    } catch (error) {
        console.error('Error fetching symptom history:', error);
        res.status(500).json({ error: 'Failed to fetch symptom history' });
    }
});

// Get symptoms for a specific date
router.get('/history/:date', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const date = new Date(req.params.date);
        
        // Adjust for timezone to ensure correct date comparison
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const entry = await SymptomEntry.findOne({
            where: {
                userId,
                date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [{
                model: Symptom,
                as: 'symptoms',
                through: { attributes: [] }
            }]
        });

        if (!entry) {
            return res.json({ symptoms: [] });
        }

        res.json(entry);
    } catch (error) {
        console.error('Error fetching symptoms for date:', error);
        res.status(500).json({ error: 'Failed to fetch symptoms for date' });
    }
});

// Get geographic symptom data
router.get('/geographic', auth, async (req, res) => {
    try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get symptoms in the region for the last 24 hours
        const recentEntries = await SymptomEntry.findAll({
            where: {
                date: {
                    [Op.gte]: last24Hours
                }
            },
            include: [{
                model: Symptom,
                as: 'symptoms',
                through: { attributes: [] }
            }, {
                model: User,
                attributes: ['id', 'latitude', 'longitude'],
                where: {
                    latitude: { [Op.not]: null },
                    longitude: { [Op.not]: null }
                }
            }]
        });

        // Process entries to get statistics
        const symptomCounts = {};
        const locationData = recentEntries.map(entry => ({
            latitude: entry.User.latitude,
            longitude: entry.User.longitude,
            symptoms: entry.symptoms.map(s => s.name)
        }));

        recentEntries.forEach(entry => {
            entry.symptoms.forEach(symptom => {
                symptomCounts[symptom.name] = (symptomCounts[symptom.name] || 0) + 1;
            });
        });

        const response = {
            totalEntries: recentEntries.length,
            symptomCounts,
            locations: locationData
        };

        res.json(response);
    } catch (error) {
        console.error('Error in geographic endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to fetch geographic data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;