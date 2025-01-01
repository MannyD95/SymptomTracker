import { sequelize } from '../../config/database.js';
import { User } from '../../models/User.js';
import { Symptom } from '../../models/Symptom.js';
import { SymptomEntry } from '../../models/SymptomEntry.js';

export const setupTestDatabase = async () => {
  try {
    // Force sync all models
    await sequelize.sync({ force: true });
    
    // Create default symptoms
    await Symptom.bulkCreate([
      { name: 'Cough' },
      { name: 'Fever' },
      { name: 'Headache' },
      { name: 'Sore Throat' },
      { name: 'Fatigue' }
    ]);

    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

export const clearTestDatabase = async () => {
  try {
    await SymptomEntry.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    console.log('Test database cleared successfully');
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
};

export const teardownTestDatabase = async () => {
  try {
    await sequelize.close();
    console.log('Test database connection closed successfully');
  } catch (error) {
    console.error('Error closing test database connection:', error);
    throw error;
  }
}; 