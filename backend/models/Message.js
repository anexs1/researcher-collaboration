// backend/models/Message.js
import { DataTypes } from "sequelize";

const MessageModel = (sequelize) => {
  const Message = sequelize.define(
    "Message",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED, // Assuming message IDs are unsigned integers
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      senderId: {
        type: DataTypes.INTEGER.UNSIGNED, // Match User ID type (int unsigned)
        allowNull: false,
        references: { model: "Users", key: "id" }, // Ensure 'Users' matches your actual table name
        onDelete: "CASCADE", // Or SET NULL if sender can be deleted but messages remain
        onUpdate: "CASCADE",
      },
      projectId: {
        type: DataTypes.INTEGER, // Match Project ID type (int signed based on previous schema)
        allowNull: false,
        references: { model: "Projects", key: "id" }, // Ensure 'Projects' matches table name
        onDelete: "CASCADE", // If project is deleted, delete messages
        onUpdate: "CASCADE",
      },
      // --- MODIFIED content ---
      content: {
        type: DataTypes.TEXT,
        allowNull: true, // <<< CHANGED: Can be null for file messages
        validate: {
          // Keep validation if text, but allow null/empty for file messages
          // Custom validation might be needed if you enforce content for text only
        },
      },
      // --- NEW Fields for File Uploads ---
      messageType: {
        type: DataTypes.ENUM("text", "file"), // Type of message
        allowNull: false,
        defaultValue: "text",
      },
      fileUrl: {
        type: DataTypes.STRING(2048), // Store URL to the file (e.g., S3 or server path)
        allowNull: true, // Only populated for 'file' type messages
        validate: {
          isUrl: true, // Optional: Basic URL format validation
        },
      },
      fileName: {
        type: DataTypes.STRING, // Store the original filename
        allowNull: true, // Only for 'file' type
      },
      mimeType: {
        type: DataTypes.STRING, // E.g., 'image/jpeg', 'application/pdf'
        allowNull: true, // Only for 'file' type
      },
      fileSize: {
        type: DataTypes.INTEGER.UNSIGNED, // Store file size in bytes (use BIGINT if > 4GB needed)
        allowNull: true, // Only for 'file' type
      },
      // --- End NEW Fields ---

      // Timestamps are automatically added by `timestamps: true` below
      // createdAt
      // updatedAt
    },
    {
      tableName: "Messages", // Explicitly set table name
      timestamps: true, // Enable createdAt and updatedAt
      underscored: false, // Use camelCase column names (e.g., senderId)
      freezeTableName: true, // Prevent Sequelize from pluralizing table name
      indexes: [
        // Existing indexes are still good
        { fields: ["senderId"] },
        { fields: ["projectId"] },
        { fields: ["createdAt"] },
        // Optional: Index messageType if you frequently query by type
        // { fields: ["messageType"] },
      ],
    }
  );

  Message.associate = (models) => {
    // Message belongs to a User (Sender)
    Message.belongsTo(models.User, {
      foreignKey: "senderId",
      as: "sender",
    });

    // Message belongs to a Project
    Message.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });
  };

  return Message;
};

export default MessageModel;
