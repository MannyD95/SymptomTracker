import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Environment validation
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables');
    process.exit(1);
}

const authenticateToken = async (req, res, next) => {
    try {
        // Modern header handling
        const authHeader = req.get('authorization');
        if (!authHeader) {
            return res.status(401).json({ 
                error: 'Access token required',
                details: 'No authorization header found'
            });
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

        if (!token) {
            return res.status(401).json({ 
                error: 'Access token required',
                details: 'No token found in authorization header'
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    error: 'Token expired',
                    details: 'Please log in again'
                });
            }
            
            return res.status(401).json({ 
                error: 'Invalid token',
                details: 'Token verification failed'
            });
        }
        
        const user = await User.findOne({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                details: 'The user associated with this token no longer exists'
            });
        }

        // Don't expose password in req.user
        const userWithoutPassword = {
            id: user.id,
            username: user.username,
            email: user.email,
            latitude: user.latitude,
            longitude: user.longitude,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        req.user = userWithoutPassword;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ 
            error: 'Authentication failed',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export default authenticateToken;