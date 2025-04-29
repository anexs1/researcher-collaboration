// backend/models/Project.js
import { DataTypes } from "sequelize";

const ProjectModel = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      // --- Model attributes use camelCase ---
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      description: { type: DataTypes.TEXT, allowNull: true }, // Allows NULL based on DB data
      category: { type: DataTypes.STRING, allowNull: true },
      ownerId: {
        // Matches DB column name
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      requiredCollaborators: {
        // Matches DB column name
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 0 },
      },
      progress: {
        // Matches DB column name
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 },
      },
      status: {
        // Matches DB column name
        type: DataTypes.ENUM(
          "Planning",
          "Active",
          "Completed",
          "On Hold",
          "Archived"
        ),
        allowNull: false,
        defaultValue: "Planning",
      },
      duration: { type: DataTypes.STRING, allowNull: true }, // Matches DB column name
      funding: { type: DataTypes.STRING, allowNull: true }, // Matches DB column name
      skillsNeeded: {
        // Model: camelCase
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        field: "skills_needed", // <<< Map to DB snake_case column
      },
      imageUrl: {
        // Model: camelCase
        type: DataTypes.STRING,
        allowNull: true,
        field: "image_url", // <<< Map to DB snake_case column
      },
      views: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      }, // Matches DB column name
      likes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      }, // Matches DB column name
      comments: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      }, // Matches DB column name
      // createdAt, updatedAt match DB column names (Sequelize defaults to camelCase unless underscored:true)
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "Projects",
      timestamps: true, // Sequelize handles createdAt, updatedAt columns
      underscored: false, // <<< SET TO FALSE because DB uses mixed case
      freezeTableName: true,
      indexes: [
        // Use model field names here because underscored: false
        { fields: ["ownerId"] },
        { fields: ["status"] },
        { fields: ["title"] },
      ],
    }
  );

  Project.associate = (models) => {
    // Use model field name (camelCase) for foreignKey
    if (
      !models.User ||
      !models.Member ||
      !models.CollaborationRequest ||
      !models.Message
    ) {
      console.error("Project Model Error: Assoc models missing!");
      return;
    }
    Project.belongsTo(models.User, { foreignKey: "ownerId", as: "owner" });
    Project.belongsToMany(models.User, {
      through: models.Member,
      foreignKey: "projectId",
      otherKey: "userId",
      as: "members",
    });
    Project.hasMany(models.Member, {
      foreignKey: "projectId",
      as: "memberships",
    });
    Project.hasMany(models.CollaborationRequest, {
      foreignKey: "projectId",
      as: "collaborationRequests",
    });
    Project.hasMany(models.Message, {
      foreignKey: "projectId",
      as: "messages",
    });
  };

  return Project;
};

export default ProjectModel;
