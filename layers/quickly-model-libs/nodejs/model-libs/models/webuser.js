const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize) => {
    return sequelize.define('WebUser', {
        ID: {
            type: DataTypes.STRING,
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
            // values: ['TENANT_ADMIN', 'DISPATCHER'],
            allowNull: false,
            defaultValue: 'DISPATCHER'
        },
        status: {
            type: DataTypes.STRING,
            // values: ['ACTIVE', 'INACTIVE'],
            allowNull: false,
            defaultValue: 'ACTIVE'
        },
        isVerifed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
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