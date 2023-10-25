const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize, DB_SCHEMA) => {
    return sequelize.define('Hub', {
        ID: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        address: {
            type: DataTypes.STRING
        },
        name: {
            type: DataTypes.STRING,
            defaultValue: false
        },
        createdBy: {
            type: DataTypes.STRING
        },
        updatedBy: {
            type: DataTypes.STRING
        },
        latLongs: {
            type: DataTypes.JSON,
        },
    }, {
        schema: DB_SCHEMA
    });
}

module.exports = init;