'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.addColumn('Tasks', 'routeSequence', { type: Sequelize.INTEGER });
     await queryInterface.addColumn('Tasks', 'routeID', { type: Sequelize.STRING });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.removeColumn('Tasks', 'routeSequence', { type: Sequelize.INTEGER });
     await queryInterface.removeColumn('Tasks', 'routeID', { type: Sequelize.STRING });
  }
};
