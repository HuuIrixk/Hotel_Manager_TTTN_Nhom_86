const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Room = sequelize.define('Room', {
  room_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  room_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('available', 'booked', 'maintenance'),
    defaultValue: 'available',
  },
  description: {
    type: DataTypes.TEXT,
  },
  capacity: {
    type: DataTypes.INTEGER, // Sức chứa (số người)
    allowNull: false,
    defaultValue: 2,
  },

  image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  amenities: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },

}, {
  tableName: 'rooms',
  timestamps: false,
});

module.exports = Room;
