// backend/models/Project.js
import { DataTypes } from "sequelize";

const ProjectModel = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      // --- Fields (camelCase in Model) ---
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: true, len: [5, 255] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      ownerId: {
        // <<< Model uses camelCase, should map to ownerId in DB
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Users", key: "id" }, // References Users table's 'id' (camelCase)
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      requiredCollaborators: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        validate: { isInt: true, min: 0 },
      }, // should map to requiredCollaborators
      status: {
        type: DataTypes.ENUM("Planning", "Active", "Completed", "On Hold"),
        allowNull: false,
        defaultValue: "Planning",
      }, // should map to status
      // createdAt, updatedAt should map to createdAt, updatedAt
    },
    {
      tableName: "Projects",
      timestamps: true, // Expects createdAt, updatedAt columns in DB
      underscored: false, // <<< CORRECTED: Set to FALSE because DB uses camelCase (ownerId)
      freezeTableName: true,
      indexes: [
        // Use MODEL field names (camelCase) for index definitions now
        { fields: ["ownerId"] }, // <<< CORRECTED
        { fields: ["status"] },
      ],
    }
  );

  Project.associate = (models) => {
    // Associations use MODEL field names (camelCase) for foreign keys
    Project.belongsTo(models.User, { foreignKey: "ownerId", as: "owner" }); // ownerId in Project model matches ownerId in DB

    // Check if models exist before associating
    if (models.CollaborationRequest) {
      Project.hasMany(models.CollaborationRequest, {
        foreignKey: "projectId",
        as: "joinRequests",
        onDelete: "CASCADE",
      });
    }
    if (models.Member && models.User) {
      Project.belongsToMany(models.User, {
        through: models.Member,
        foreignKey: "projectId",
        otherKey: "userId",
        as: "members",
      }); // projectId/userId in Member model
      Project.hasMany(models.Member, {
        foreignKey: "projectId",
        as: "memberships",
      }); // projectId in Member model
    }
    if (models.Comment) {
      Project.hasMany(models.Comment, {
        foreignKey: "projectId",
        as: "comments",
        onDelete: "CASCADE",
      });
    }
    if (models.Message) {
      // Add if projects can have messages directly (less common)
      // Project.hasMany(models.Message, { foreignKey: 'projectId', as: 'projectMessages' });
    }
  };

  return Project;
};

export default ProjectModel;
