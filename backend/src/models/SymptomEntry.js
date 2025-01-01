import { Model } from 'sequelize';

const initSymptomEntry = (sequelize, DataTypes) => {
    class SymptomEntry extends Model {
        static associate(models) {
            SymptomEntry.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });
            SymptomEntry.belongsToMany(models.Symptom, {
                through: 'SymptomEntrySymptoms',
                as: 'symptoms'
            });
        }
    }

    SymptomEntry.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'SymptomEntry'
    });

    return SymptomEntry;
};

export default initSymptomEntry;