const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize) => {
    return sequelize.define('Team', {
        ID: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },    
        name: {
            type: DataTypes.STRING,
            allowNull: false        
        },
        lastUpdated: {
            type: DataTypes.DATE
        },
        lastUpdatedBy: {
            type: DataTypes.STRING
        }
    }, {});
}

module.exports = init