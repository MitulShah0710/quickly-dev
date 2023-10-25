const { Sequelize, DataTypes, json, Deferrable } = require('sequelize');

const init = (sequelize, DB_SCHEMA) => {
    return sequelize.define('Location', {
        ID: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        address: {
            type: DataTypes.STRING,
            // allowNull: false
        },
        latLongs: {
            type: DataTypes.JSON,
            // allowNull: false
        },
        createdBy: {
            type: DataTypes.STRING
        },
        updatedBy: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.CHAR,
            value: ["H", "B"],
            defaultValue: "H",
            // allowNull: false
        },
        subTypes: {
            type: DataTypes.STRING
        }
    }, {
        schema: DB_SCHEMA
    });
}

module.exports = init;