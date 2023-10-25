const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize, DB_SCHEMA) => {
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
        updatedBy: {
            type: DataTypes.STRING
        },
        createdBy: {
            type: DataTypes.STRING
        },
        ON_HOLD: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        configs: {
            type: DataTypes.JSON,
            defaultValue: {
                driving_times: [10, 15, 25, 50],
                waiting_time_between_invites: 120,
                max_tasks_per_agent: 5
            }
        },
        country: {
            type: DataTypes.STRING
        },
        address: {
            type: DataTypes.STRING
        },
        zipCode: {
            type: DataTypes.STRING
        },
        typeOfBusiness: {
            type: DataTypes.INTEGER
        },
        averageDrivers: {
            type: DataTypes.INTEGER
        },
        averageMonthlyOrders: {
            type: DataTypes.INTEGER
        },
        apiKeyId: {
            type: DataTypes.STRING
        },
        apiKeyValue: {
            type: DataTypes.STRING
        }
    }, {
        schema: DB_SCHEMA
    }
    );
}

module.exports = init;