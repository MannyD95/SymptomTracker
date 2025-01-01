const { QueryTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // First, find all duplicate entries
        const findDuplicates = `
            SELECT "userId", date, COUNT(*)
            FROM "SymptomEntries"
            GROUP BY "userId", date
            HAVING COUNT(*) > 1
        `;

        // Keep only the most recent entry for each userId+date combination
        const dedupeQuery = `
            DELETE FROM "SymptomEntries"
            WHERE id IN (
                SELECT id
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY "userId", date ORDER BY "updatedAt" DESC) as rnum
                    FROM "SymptomEntries"
                ) t
                WHERE t.rnum > 1
            )
        `;

        // Execute the cleanup
        await queryInterface.sequelize.query(dedupeQuery);

        // Now add the unique constraint
        await queryInterface.addIndex('SymptomEntries', 
            ['userId', 'date'],
            {
                unique: true,
                name: 'symptom_entries_user_id_date'
            }
        );
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex('SymptomEntries', 'symptom_entries_user_id_date');
    }
}; 