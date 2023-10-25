const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize, DB_SCHEMA) => {
    return sequelize.define('Agent', {
        ID: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'ACTIVE'
        },
        workStatus: {
            type: DataTypes.STRING,
            defaultValue: 'OFFLINE'
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdBy: {
            type: DataTypes.STRING
        },
        updatedBy: {
            type: DataTypes.STRING
        },
        latitude: {
            type: DataTypes.FLOAT
        },
        longitude: {
            type: DataTypes.FLOAT
        },
        homeAddress: {
            type: DataTypes.STRING
        },
        homeLatLongs: {
            type: DataTypes.JSON,
        },
        activeTask: {
            type: DataTypes.STRING
        }
    }, {
        schema: DB_SCHEMA
    });
}

module.exports = init