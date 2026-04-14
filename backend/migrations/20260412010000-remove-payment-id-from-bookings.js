'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('bookings');

    if (table.payment_id) {
      await queryInterface.removeColumn('bookings', 'payment_id');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('bookings');

    if (!table.payment_id) {
      await queryInterface.addColumn('bookings', 'payment_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },
};