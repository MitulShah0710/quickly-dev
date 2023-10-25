const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize, DB_SCHEMA) => {
    return sequelize.define('TaskHistory', {
        ID: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        timestamp: {
            type: "TIMESTAMP",
            defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "NOT_ASSIGNED"
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true
        },
        changedBy: {
            type: DataTypes.STRING,
        },
        latLongs: {
            type: DataTypes.JSON,
            // allowNull: false
        },
        location: {
            type: DataTypes.STRING
        }

    }, {
        schema: DB_SCHEMA
    });
}

module.exports = init;