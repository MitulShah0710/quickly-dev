'use strict';

const { env: { NODE_ENV }} = process
const SCHEMA_MAP = {
  'staging': 'test',
  'agdev': 'public'
}

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Locations', {
      ID: {
        type:Sequelize.DataTypes.UUID,
        defaultValue:Sequelize.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      phone: {
          type:Sequelize.DataTypes.STRING,
          allowNull: false
      },
      name: {
          type:Sequelize.DataTypes.STRING,
          allowNull: false
      },
      email: {
          type:Sequelize.DataTypes.STRING,
      },
      address: {
          type:Sequelize.DataTypes.STRING,
      },
      latLongs: {
          type:Sequelize.DataTypes.JSON,
      },
      type: {
        type:Sequelize.DataTypes.STRING,
        value: ["H", "B"],
        defaultValue: "H",
      },
      TenantID: {
        type: Sequelize.DataTypes.STRING,
        references: {
          model: {
            tableName: 'Tenants',
            schema: SCHEMA_MAP[NODE_ENV]
          },
          key: 'ID'
        },
        allowNull: false
      },
      createdBy: {
        type:Sequelize.DataTypes.STRING,
      },
      updatedBy: {
        type:Sequelize.DataTypes.STRING,
      },
      createdAt: {
        type:Sequelize.DataTypes.DATE,
      },
      updatedAt: {
        type:Sequelize.DataTypes.DATE,
      },
    }, {
      schema: SCHEMA_MAP[NODE_ENV]
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Locations');
  }
};
