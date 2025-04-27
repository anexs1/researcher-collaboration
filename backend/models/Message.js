// backend/models/Message.js
import { DataTypes } from "sequelize";

const MessageModel = (sequelize) => {
  const Message = sequelize.define(
    "Message",
    {
      // --- Fields (camelCase - Matching CORRECTED DB Columns) ---
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      senderId: {
        // Expects DB column 'senderId'
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false, // <<< Kept as false (required)
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE", // <<< CHANGED: Match CREATE TABLE (or choose RESTRICT)
        onUpdate: "CASCADE",
      },
      receiverId: {
        // Expects DB column 'receiverId'
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false, // <<< Kept as false (required)
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE", // <<< CHANGED: Match CREATE TABLE (or choose RESTRICT)
        onUpdate: "CASCADE",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: { msg: "Message content cannot be empty." } }, // Added validation message
      },
      readStatus: {
        // Expects DB column 'readStatus'
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // createdAt, updatedAt (Expects DB columns 'createdAt', 'updatedAt')
      // These are automatically added by `timestamps: true`
    },
    {
      tableName: "Messages",
      timestamps: true, // <<< Correct: requires createdAt and updatedAt columns
      underscored: false, // <<< Correct: DB uses camelCase columns based on successful CREATE TABLE
      freezeTableName: true,
      indexes: [
        // Use MODEL field names (camelCase) when underscored: false
        { fields: ["senderId"] },
        { fields: ["receiverId"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  Message.associate = (models) => {
    // Associations use MODEL field names (camelCase) for foreign keys
    // These define how to get User details FROM a Message instance
    Message.belongsTo(models.User, { foreignKey: "senderId", as: "sender" });
    Message.belongsTo(models.User, {
      foreignKey: "receiverId",
      as: "receiver",
    });
  };

  return Message;
};

export default MessageModel;
