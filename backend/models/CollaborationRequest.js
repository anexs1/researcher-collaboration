// backend/models/CollaborationRequest.js
import { DataTypes } from "sequelize";

const CollaborationRequestModel = (sequelize) => {
  const CollaborationRequest = sequelize.define(
    "CollaborationRequest", // Model name (usually singular PascalCase)
    {
      // Primary Key
      id: {
        type: DataTypes.INTEGER.UNSIGNED, // Match DB dump if it was UNSIGNED
        primaryKey: true,
        autoIncrement: true,
      },

      // --- Foreign Keys ---
      projectId: {
        type: DataTypes.INTEGER.UNSIGNED, // Match Project's ID type
        allowNull: false,
        references: { model: "Projects", key: "id" }, // Target table name 'Projects'
        onDelete: "CASCADE", // Delete request if project is deleted
        // No 'field:' needed if underscored: false and DB column is 'projectId'
      },
      requesterId: {
        type: DataTypes.INTEGER.UNSIGNED, // Match User's ID type
        allowNull: false,
        references: { model: "Users", key: "id" }, // Target table name 'Users'
        onDelete: "CASCADE", // Delete request if user is deleted
        // No 'field:' needed if underscored: false and DB column is 'requesterId'
      },

      // --- Request Details ---
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
        // No 'field:' needed if DB column is 'status'
      },
      requestMessage: {
        type: DataTypes.TEXT,
        allowNull: true, // Allow optional message
        // No 'field:' needed if DB column is 'requestMessage'
      },
      responseMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        // No 'field:' needed if DB column is 'responseMessage'
      },
      respondedAt: {
        type: DataTypes.DATE, // Maps to TIMESTAMP/DATETIME
        allowNull: true,
        // No 'field:' needed if DB column is 'respondedAt'
      },
      // createdAt and updatedAt are handled by Sequelize options below
    },
    {
      // --- Options ---
      timestamps: true, // Enable createdAt and updatedAt handling
      tableName: "joinrequests", // <<< Match your actual table name exactly
      // === IMPORTANT: Set based on DB column names ===
      // If DB columns are camelCase (projectId, requesterId, createdAt):
      underscored: false,
      // If DB columns are snake_case (project_id, requester_id, created_at):
      // underscored: true,
      // =============================================
      freezeTableName: true, // Prevent Sequelize from pluralizing table name
      indexes: [
        { fields: ["projectId"] }, // Index for faster project lookups
        { fields: ["requesterId"] }, // Index for faster user lookups
        { fields: ["status"] }, // Index for faster status filtering

        // --- Consider your unique constraint needs ---
        // This prevents a user from having multiple PENDING requests for the SAME project
        {
          unique: true,
          fields: ["projectId", "requesterId", "status"],
          where: { status: "pending" },
        },
        // If a user can only EVER request to join ONCE (regardless of status), use:
        // { unique: true, fields: ["projectId", "requesterId"] },
      ],
    }
  );

  // --- Associations ---
  CollaborationRequest.associate = (models) => {
    // A request belongs to a User (the one making the request)
    CollaborationRequest.belongsTo(models.User, {
      foreignKey: "requesterId", // <<< MUST match the key defined in this model's fields
      as: "requester", // Alias used in controller includes
    });
    // A request belongs to a Project
    CollaborationRequest.belongsTo(models.Project, {
      foreignKey: "projectId", // <<< MUST match the key defined in this model's fields
      as: "project", // Optional alias if needed elsewhere
    });
  };

  return CollaborationRequest;
};

export default CollaborationRequestModel;
