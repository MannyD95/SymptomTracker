import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, latitude, longitude } = req.body;
        
        const user = await User.create({
            username,
            email,
            password,
            latitude,
            longitude
        });

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                latitude: user.latitude,
                longitude: user.longitude
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            error: 'Registration failed',
            details: error.message
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({
                error: 'Authentication failed',
                details: 'User not found'
            });
        }

        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({
                error: 'Authentication failed',
                details: 'Invalid password'
            });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                latitude: user.latitude,
                longitude: user.longitude
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            details: error.message
        });
    }
});

// Logout route
router.post('/logout', auth, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

export default router; 