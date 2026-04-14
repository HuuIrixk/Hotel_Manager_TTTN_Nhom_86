const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ContactMessage = sequelize.define(
  "ContactMessage",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "contact_messages",
    timestamps: false,
  }
);

// Tự tạo bảng nếu chưa tồn tại
ContactMessage.sync({ alter: false }).catch(() => {
  ContactMessage.sync({ force: false });
});

module.exports = ContactMessage;
