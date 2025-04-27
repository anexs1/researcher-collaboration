// backend/models/Message.js
import { DataTypes } from "sequelize";

const MessageModel = (sequelize) => {
  const Message = sequelize.define(
    "Message",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      senderId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE", // Or SET NULL if preferred
        onUpdate: "CASCADE",
      },
      receiverId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE", // Or SET NULL
        onUpdate: "CASCADE",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      readStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // createdAt, updatedAt managed by timestamps:true
    },
    {
      tableName: "Messages",
      timestamps: true, // Expects createdAt, updatedAt columns
      underscored: false, // <<< DB uses camelCase for this table
      freezeTableName: true,
      indexes: [
        { fields: ["senderId"] },
        { fields: ["receiverId"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  Message.associate = (models) => {
    Message.belongsTo(models.User, { foreignKey: "senderId", as: "sender" });
    Message.belongsTo(models.User, {
      foreignKey: "receiverId",
      as: "receiver",
    });
  };

  return Message;
};

export default MessageModel;
