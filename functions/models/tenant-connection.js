const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize, DB_SCHEMA) => {
    return sequelize.define('TenantConnection', {
        ID: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        sourceTenantID: {
            type: DataTypes.STRING,
            allowNull: false
        },
        destTenantID: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'INIT',
            allowNull: false
        },
        name: {
            type: DataTypes.STRING
        },
        tenantAdminName: {
            type: DataTypes.STRING
        },
        tenantAdminEmail: {
            type: DataTypes.STRING
        },
        createdBy: {
            type: DataTypes.STRING
        },
        updatedBy: {
            type: DataTypes.STRING
        }

    }, {
        schema: DB_SCHEMA,
        indexes: [
            {
                unique: true,
                fields: ['sourceTenantID', 'destTenantID'],
                name: 'TenantConnection-index'
            }
        ]
    });
}

module.exports = init