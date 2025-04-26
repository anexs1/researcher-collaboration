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
        // <<< Model uses camelCase, maps to owner_id
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
      }, // maps to required_collaborators
      status: {
        type: DataTypes.ENUM("Planning", "Active", "Completed", "On Hold"),
        allowNull: false,
        defaultValue: "Planning",
      }, // maps to status
      // createdAt maps to created_at
      // updatedAt maps to updated_at
    },
    {
      tableName: "Projects",
      timestamps: true, // Expects created_at, updated_at columns in DB
      underscored: true, // <<< Set to TRUE because DB uses snake_case (owner_id, created_at)
      freezeTableName: true,
      indexes: [
        // Use DB column names (snake_case) in index definitions
        { fields: ["owner_id"] },
        { fields: ["status"] },
      ],
    }
  );

  Project.associate = (models) => {
    // Associations use MODEL field names (camelCase) for foreign keys
    Project.belongsTo(models.User, { foreignKey: "ownerId", as: "owner" }); // ownerId in Project model maps to owner_id in DB
    Project.hasMany(models.CollaborationRequest, {
      foreignKey: "projectId",
      as: "joinRequests",
      onDelete: "CASCADE",
    }); // projectId in Request model

    // Many-to-Many with User through Member
    Project.belongsToMany(models.User, {
      through: models.Member,
      foreignKey: "projectId", // FK in Member model (camelCase) maps to project_id in DB
      otherKey: "userId", // FK in Member model (camelCase) maps to user_id in DB
      as: "members",
    });

    Project.hasMany(models.Member, {
      foreignKey: "projectId", // FK in Member model (camelCase) maps to project_id in DB
      as: "memberships",
    });

    if (models.Comment) {
      Project.hasMany(models.Comment, {
        foreignKey: "projectId",
        as: "comments",
        onDelete: "CASCADE",
      });
    }
  };

  return Project;
};

export default ProjectModel;
