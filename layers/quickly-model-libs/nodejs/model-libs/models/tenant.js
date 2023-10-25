const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize) => {
    return sequelize.define('Tenant', {
        ID: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        tenantAdminName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        tenantAdminEmail: {
            type: DataTypes.STRING,
            allowNull: false        
        },
        status: {
            type: DataTypes.STRING,
            // values: ['ACTIVE', 'INACTIVE'],
            allowNull: false,
            defaultValue: 'ACTIVE'
        },
        logoURL: {
            type: DataTypes.STRING
        },
        websiteURL: {
            type: DataTypes.STRING
        },
        quicklyNetworkEnabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        lastUpdated: {
            type: DataTypes.DATE
        },
        lastUpdatedBy: {
            type: DataTypes.STRING
        }
      }, {}
    );
}

module.exports = init;