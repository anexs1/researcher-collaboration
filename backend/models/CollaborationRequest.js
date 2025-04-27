// backend/models/CollaborationRequest.js
import { DataTypes } from "sequelize";

const CollaborationRequestModel = (sequelize) => {
  const CollaborationRequest = sequelize.define(
    "CollaborationRequest",
    {
      // Fields (camelCase - Assuming DB columns are also camelCase for this table)
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      projectId: {
        // <<< Model field (camelCase)
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Projects", key: "id" },
        onDelete: "CASCADE",
      },
      requesterId: {
        // <<< Model field (camelCase)
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      requestMessage: { type: DataTypes.TEXT, allowNull: true }, // <<< Model field (camelCase)
      responseMessage: { type: DataTypes.TEXT, allowNull: true }, // <<< Model field (camelCase)
      respondedAt: { type: DataTypes.DATE, allowNull: true }, // <<< Model field (camelCase)
      // createdAt, updatedAt (Expects camelCase DB columns)
    },
    {
      timestamps: true, // Expects createdAt, updatedAt columns
      tableName: "joinrequests", // <<< Match your actual table name
      underscored: false, // <<< Set to FALSE assuming DB uses camelCase columns for this table
      freezeTableName: true,
      indexes: [
        // Use MODEL field names (camelCase)
        { fields: ["projectId"] },
        { fields: ["requesterId"] },
        { fields: ["status"] },
        // Unique constraint on pending requests
        {
          unique: true,
          fields: ["projectId", "requesterId", "status"],
          where: { status: "pending" },
        },
      ],
    }
  );

  CollaborationRequest.associate = (models) => {
    // Associations use MODEL field names (camelCase)
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
