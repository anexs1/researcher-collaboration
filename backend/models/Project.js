// backend/models/Project.js
import { DataTypes } from "sequelize";

const ProjectModel = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      // --- Fields (camelCase in Model - MUST MATCH DB COLUMNS) ---
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
        // <<< Model field (camelCase)
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
      },
      status: {
        type: DataTypes.ENUM("Planning", "Active", "Completed", "On Hold"),
        allowNull: false,
        defaultValue: "Planning",
      },
      // createdAt, updatedAt (Sequelize expects camelCase columns by default when underscored: false)
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
    Project.hasMany(models.CollaborationRequest, {
      foreignKey: "projectId",
      as: "joinRequests",
      onDelete: "CASCADE",
    }); // projectId in Request model

    // Many-to-Many with User through Member
    Project.belongsToMany(models.User, {
      through: models.Member,
      foreignKey: "projectId", // FK in Member model (camelCase)
      otherKey: "userId", // FK in Member model (camelCase)
      as: "members",
    });

    Project.hasMany(models.Member, {
      foreignKey: "projectId", // FK in Member model (camelCase)
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
