const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize, DB_SCHEMA) => {
    return sequelize.define('Task', {
        ID: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        taskInvite: {
            type: DataTypes.STRING,
            value: ["UNSENT", "SENT"],
            defaultValue: "UNSENT"
        },
        taskType: {
            type: DataTypes.STRING,
            value: ["IMMEDIATE", "SCHEDULED", "PLANNED"],
            defaultValue: "IMMEDIATE",
            // allowNull: false
        },
        taskMode: {
            type: DataTypes.STRING,
            value: ["IMMEDIATE", "SAME_DAY", "NEXT_DAY", "APPOINTED"],
            defaultValue: "IMMEDIATE",
            // allowNull: false
        },
        priority: {
            type: DataTypes.STRING,
            value: ["LOW", "MEDIUM", "HIGH"],
            // defaultValue: "IMMEDIATE",
            // allowNull: false
        },
        value: {
            type: DataTypes.FLOAT,
            // value: ["LOW", "MEDIUM", "HIGH"],
            defaultValue: 0.0,
            // allowNull: false
        },
        completedOn: {
            type: "TIMESTAMP",
        },
        ratingByAgent: {
            type: DataTypes.INTEGER,
        },
        commentsByAgent: {
            type: DataTypes.STRING,
        },
        customerName: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        customerEmail: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        customerPhone: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        customerAddress: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        customerLatLongs: {
            type: DataTypes.JSON,
            // allowNull: false
        },
        taskDescription: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        taskStatus: {
            type: DataTypes.STRING,
            defaultValue: "NOT_ASSIGNED"
        },
        pickupAddress: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        pickupLatLongs: {
            type: DataTypes.JSON,
            // allowNull: false
        },
        deliveryAddress: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        deliveryPhoto: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        deliverySignature: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        deliveryComment: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        createdBy: {
            type: DataTypes.STRING
        },
        updatedBy: {
            type: DataTypes.STRING
        },
        origin: {
            type: DataTypes.STRING
        },
        executor: {
            type: DataTypes.STRING
        },
        serviceTime: {
            type: DataTypes.JSON
        },
        visitDate: {
            type: DataTypes.DATEONLY
        },
        visitTimeWindow: {
            type: DataTypes.JSON
        },
        isCompleted: {
            type: DataTypes.BOOLEAN
        },
        taskDetails: {
            type: DataTypes.JSON
        },
        weight: {
            type: DataTypes.FLOAT
        },
        additionalInfo: {
            type: DataTypes.STRING
        },
        orderID: {
            type: DataTypes.STRING
        },
        orderPlacedOn: {
            type: DataTypes.STRING
        },
        groupTask: {
            type: DataTypes.BOOLEAN
        },
        allowEdit: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        requestedDate: {
            type: DataTypes.DATE,
            defaultValue: new Date(),
            allowNull: true
        },
        plannedDate: {
            type: DataTypes.DATE,
            defaultValue: new Date(),
            allowNull: true
        },
        deliveryDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        pickupName: {
            type: DataTypes.STRING
        },
        pickupPhone: {
            type: DataTypes.STRING
        },
        pickupEmail: {
            type: DataTypes.STRING
        },
        customerGeocodeQuality: {
            type: DataTypes.INTEGER
        },
        pickupGeocodeQuality: {
            type: DataTypes.INTEGER
        },
        routeSequence: {
            type: DataTypes.INTEGER
        },
        routeID: {
            type: DataTypes.STRING
        }
    }, {
        schema: DB_SCHEMA
    });
}

module.exports = init;