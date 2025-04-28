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
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        field: "senderId", // Explicitly map to camelCase column if needed
      },
      projectId: {
        // Changed from groupId, links to Project
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Projects", key: "id" }, // Reference Projects table
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        field: "projectId", // Explicitly map to camelCase column if needed
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      // receiverId is removed
      // readStatus is removed (handle per-user read status in a separate table if needed)
    },
    {
      tableName: "Messages", // Ensure this matches your actual table name
      timestamps: true, // Expects createdAt, updatedAt
      // Set underscored based on your DB column naming convention for Messages table
      // If Messages table uses camelCase (createdAt, senderId, projectId), set underscored: false
      // If Messages table uses snake_case (created_at, sender_id, project_id), set underscored: true
      underscored: false, // <<< ADJUST THIS based on your Messages table columns
      freezeTableName: true,
      indexes: [
        // Use MODEL field names (camelCase) unless underscored:true maps them
        { fields: ["senderId"] },
        { fields: ["projectId"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  Message.associate = (models) => {
    // A Message belongs to a User (sender)
    // Use the alias 'sender' so you can include it easily
    Message.belongsTo(models.User, { foreignKey: "senderId", as: "sender" });

    // A Message belongs to a Project (the group chat)
    // Use the alias 'project'
    Message.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });
  };

  return Message;
};

export default MessageModel;
