import { Sequelize, DataTypes } from 'sequelize';
import config from '../config/config.js';
import initUser from './User.js';
import initSymptom from './Symptom.js';
import initSymptomEntry from './symptomEntry.js';

// Determine which environment we're in
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool
    }
);

// Initialize models
const User = initUser(sequelize, DataTypes);
const Symptom = initSymptom(sequelize, DataTypes);
const SymptomEntry = initSymptomEntry(sequelize, DataTypes);

// Define associations
User.hasMany(SymptomEntry, {
    foreignKey: {
        name: 'userId',
        allowNull: false
    },
    as: 'entries',
    onDelete: 'CASCADE'
});

SymptomEntry.belongsTo(User, {
    foreignKey: {
        name: 'userId',
        allowNull: false
    }
});

SymptomEntry.belongsToMany(Symptom, {
    through: 'SymptomEntrySymptoms',
    as: 'symptoms'
});

Symptom.belongsToMany(SymptomEntry, {
    through: 'SymptomEntrySymptoms',
    as: 'entries'
});

// Test database connection
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
        // Sync models with database
        return sequelize.sync();
    })
    .then(() => {
        console.log('Database models synchronized successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

export {
    sequelize,
    Sequelize,
    User,
    Symptom,
    SymptomEntry
};