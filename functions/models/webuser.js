const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize, DB_SCHEMA) => {
    return sequelize.define('WebUser', {
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
        userType: {
            type: DataTypes.STRING,
            defaultValue: 'DISPATCHER'
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'ACTIVE'  
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        createdBy: {
            type: DataTypes.DATE
        },
        updatedBy: {
            type: DataTypes.STRING
        }
    }, {
        schema: DB_SCHEMA
    });
}

module.exports = init