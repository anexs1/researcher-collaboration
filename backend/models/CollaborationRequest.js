// backend/models/CollaborationRequest.js
import { DataTypes } from "sequelize";

const CollaborationRequestModel = (sequelize) => {
  const CollaborationRequest = sequelize.define(
    "CollaborationRequest",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // Ensure these fields and their DB column names match your table
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "projectId", // Assumes DB column is 'projectId'
        references: { model: "Projects", key: "id" }, // Assumes Projects table exists
        onDelete: "CASCADE",
      },
      requesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "requesterId", // Assumes DB column is 'requesterId'
        references: { model: "Users", key: "id" }, // Assumes Users table exists
        onDelete: "CASCADE",
      },
      // NOTE: recipientId (Project Owner) needs to be fetched separately if needed, not stored here based on error
      // REMOVED recipientId field definition

      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false, // Ensure status is not null
        defaultValue: "pending",
        field: "status", // Assumes DB column is 'status'
      },
      requestMessage: {
        // Changed from 'message' to match your model definition
        type: DataTypes.TEXT,
        allowNull: true,
        field: "requestMessage", // Assumes DB column is 'requestMessage'
      },

      // --- REMOVED fields potentially not in DB ---
      // responseMessage: { type: DataTypes.TEXT, allowNull: true, field: "responseMessage" },
      // respondedAt: { type: DataTypes.DATE, allowNull: true, field: "respondedAt" },
      // publicationId: { type: DataTypes.INTEGER, allowNull: true, field: "publicationId" }, // If this column doesn't exist
    },
    {
      timestamps: true, // Keep createdAt, updatedAt if they exist in DB
      tableName: "joinrequests", // Correct table name
      underscored: false, // Keep as you had it (camelCase model fields)
      freezeTableName: true, // Keep as you had it
      indexes: [
        // Update indexes based on existing columns
        { fields: ["projectId"] },
        { fields: ["requesterId"] },
        // { fields: ['recipientId'] }, // Remove if column removed
        { fields: ["status"] },
        // Adjust unique key if recipientId is removed
        { unique: true, fields: ["projectId", "requesterId"] }, // Unique request per user per project
      ],
    }
  );

  CollaborationRequest.associate = (models) => {
    CollaborationRequest.belongsTo(models.User, {
      foreignKey: "requesterId", // Use the correct field name from this model
      as: "requester",
    });
    CollaborationRequest.belongsTo(models.Project, {
      foreignKey: "projectId", // Use the correct field name from this model
      as: "project",
    });
    // Remove recipient association if field is removed
    // CollaborationRequest.belongsTo(models.User, { foreignKey: 'recipientId', as: 'recipient' });
  };

  return CollaborationRequest;
};

export default CollaborationRequestModel;
