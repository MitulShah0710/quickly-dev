const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize, DB_SCHEMA) => {
    return sequelize.define('TaskInvite', {
        ID: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        agentID: {
            type: DataTypes.JSON
        },
        createdBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        updatedBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        rejectedBy: {
            type: DataTypes.JSON,
            // defaultValue: []
        }
    }, {
        schema: DB_SCHEMA
    });
}

module.exports = init