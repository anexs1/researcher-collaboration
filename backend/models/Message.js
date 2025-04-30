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
        allowNull: false,
      },
      senderId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Projects", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true, // Can be null for file messages
        // NOTE: Consider adding custom validation later if you need to ensure
        // content is present ONLY for messageType 'text'
        validate: {}, // Keeping validate block empty for now
      },
      messageType: {
        type: DataTypes.ENUM("text", "file"), // Type of message
        allowNull: false,
        defaultValue: "text",
      },
      // --- EDITED fileUrl field ---
      fileUrl: {
        type: DataTypes.STRING(2048), // Store relative path or full URL
        allowNull: true, // Only populated for 'file' type messages
        // REMOVED the validation block that contained 'isUrl: true'
        // validate: {
        //  isUrl: true, // <-- REMOVED THIS LINE
        // },
      },
      // --- End EDITED fileUrl field ---
      fileName: {
        type: DataTypes.STRING, // Store the original filename
        allowNull: true, // Only for 'file' type
      },
      mimeType: {
        type: DataTypes.STRING, // E.g., 'image/jpeg', 'application/pdf'
        allowNull: true, // Only for 'file' type
      },
      fileSize: {
        type: DataTypes.INTEGER.UNSIGNED, // Store file size in bytes
        allowNull: true, // Only for 'file' type
      },
      // createdAt, updatedAt added by timestamps: true
    },
    {
      tableName: "Messages",
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      indexes: [
        { fields: ["senderId"] },
        { fields: ["projectId"] },
        { fields: ["createdAt"] },
        // { fields: ["messageType"] }, // Optional index
      ],
    }
  );

  Message.associate = (models) => {
    // Message belongs to a User (Sender)
    Message.belongsTo(models.User, {
      foreignKey: "senderId",
      as: "sender", // Alias used in includes
    });

    // Message belongs to a Project
    Message.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project", // Alias used in includes
    });
  };

  return Message;
};

export default MessageModel;
