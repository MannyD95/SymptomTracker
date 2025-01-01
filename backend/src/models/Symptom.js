import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class Symptom extends Model {
        static associate(models) {
            Symptom.belongsToMany(models.SymptomEntry, {
                through: 'SymptomEntrySymptoms',
                as: 'entries'
            });
        }
    }

    Symptom.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        modelName: 'Symptom'
    });

    return Symptom;
};