'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Tenants', 'apiKeyId', { type: Sequelize.STRING });
    await queryInterface.addColumn('Tenants', 'apiKeyValue', { type: Sequelize.STRING });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tenants', 'apiKeyId', { type: Sequelize.STRING });
    await queryInterface.removeColumn('Tenants', 'apiKeyValue', { type: Sequelize.STRING });
  }
};
