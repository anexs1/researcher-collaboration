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
        onDelete: "CASCADE", // Keep: A message always has a sender
        onUpdate: "CASCADE",
      },
      // --- CHANGED: Renamed groupId to projectId ---
      projectId: {
        // Changed from groupId
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Projects", key: "id" }, // Reference Projects table
        onDelete: "CASCADE", // If project is deleted, delete messages
        onUpdate: "CASCADE",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      // REMOVED: receiverId
      // REMOVED: readStatus (complex for groups)
    },
    {
      tableName: "Messages",
      timestamps: true,
      underscored: false, // Assuming Messages table uses camelCase
      freezeTableName: true,
      indexes: [
        { fields: ["senderId"] },
        // --- CHANGED: Index on projectId ---
        { fields: ["projectId"] }, // Changed from groupId
        { fields: ["createdAt"] },
      ],
    }
  );

  Message.associate = (models) => {
    // Keep sender association
    Message.belongsTo(models.User, { foreignKey: "senderId", as: "sender" });

    // --- CHANGED: Associate with Project instead of Group ---
    // ADDED: Project association
    Message.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    }); // Changed from Group

    // REMOVED: Receiver association
  };

  return Message;
};

export default MessageModel;
