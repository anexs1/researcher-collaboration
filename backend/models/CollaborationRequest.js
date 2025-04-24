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
      // --- Fields that MUST exist in your 'joinrequests' table ---
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "projectId", // Assuming DB column name is projectId
        references: { model: "Projects", key: "id" },
        onDelete: "CASCADE",
      },
      requesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "requesterId", // Assuming DB column name is requesterId
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
        field: "status", // Assuming DB column name is status
      },
      requestMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "requestMessage", // Assuming DB column name is requestMessage
      },
      responseMessage: {
        type: DataTypes.TEXT,
        allowNull: true, // Matches DB 'YES' for Null from DESCRIBE output
        field: "responseMessage",
      },
      respondedAt: {
        type: DataTypes.DATE, // Matches TIMESTAMP column type
        allowNull: true, // Matches DB 'YES' for Null from DESCRIBE output
        field: "respondedAt",
      },
    },
    {
      timestamps: true, // Requires createdAt and updatedAt columns in DB
      tableName: "joinrequests",
      underscored: false, // Use if DB columns are camelCase (projectId)
      freezeTableName: true,
      indexes: [
        // Only index existing columns
        { fields: ["projectId"] },
        { fields: ["requesterId"] },
        { fields: ["status"] },
        // Unique key based on existing columns (pending status included)
        // If you want *any* request (approved/rejected too) to be unique per user/project, remove status here
        { unique: true, fields: ["projectId", "requesterId", "status"] },
      ],
    }
  );

  CollaborationRequest.associate = (models) => {
    CollaborationRequest.belongsTo(models.User, {
      foreignKey: "requesterId",
      as: "requester",
    });
    CollaborationRequest.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });
  };

  return CollaborationRequest;
};

export default CollaborationRequestModel;
