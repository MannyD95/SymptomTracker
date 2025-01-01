const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Symptoms', 'category');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Symptoms', 'category', {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Other'
        });
    }
}; 