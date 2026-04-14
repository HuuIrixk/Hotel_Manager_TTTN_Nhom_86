const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Room = require("./room.model");
const User = require("./user.model");

const Booking = sequelize.define("Booking", {
  booking_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  check_in: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  check_out: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  status: {
    type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
    defaultValue: "pending",
  },

  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },


}, {
  tableName: "bookings",
  timestamps: false,
});

const Payment = require("./payment.model");

// Quan hệ
Booking.belongsTo(User, { foreignKey: "user_id" });
Booking.belongsTo(Room, { foreignKey: "room_id" });
Booking.hasOne(Payment, { foreignKey: "booking_id" });

module.exports = Booking;
