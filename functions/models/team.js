const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize, DB_SCHEMA) => {
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
        autoAssignment: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        minCoverageRadius: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 5.0
        },
        maxCoverageRadius: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 20.0
        },
        createdBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        updatedBy: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        schema: DB_SCHEMA
    });
}

module.exports = init