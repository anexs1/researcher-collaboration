// backend/models/Project.js
import { DataTypes } from "sequelize";

const ProjectModel = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ownerId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE", // Or restrict/set null based on your rules
        onUpdate: "CASCADE",
        field: "ownerId", // Explicit mapping if needed
      },
      // Add other project fields as needed (e.g., status, category)
    },
    {
      tableName: "Projects", // Ensure this matches your actual table name
      timestamps: true, // Expects createdAt, updatedAt
      // Set based on your Projects table column naming (e.g., ownerId vs owner_id)
      underscored: false, // <<< ADJUST THIS based on your Projects table columns
      freezeTableName: true,
      indexes: [
        // Use MODEL field names unless underscored:true maps them
        { fields: ["ownerId"] },
        { fields: ["title"] },
      ],
    }
  );

  Project.associate = (models) => {
    // Project belongs to a User (Owner)
    Project.belongsTo(models.User, { foreignKey: "ownerId", as: "owner" });

    // Project has many Members (through Member table)
    Project.belongsToMany(models.User, {
      through: models.Member, // Join table
      foreignKey: "projectId", // Key in Member pointing to Project
      otherKey: "userId", // Key in Member pointing to User
      as: "members", // Alias to get users who are members
    });
    // Project has many direct Membership records
    Project.hasMany(models.Member, {
      foreignKey: "projectId",
      as: "projectMemberships",
    });

    // Project receives CollaborationRequests
    if (models.CollaborationRequest) {
      Project.hasMany(models.CollaborationRequest, {
        foreignKey: "projectId",
        as: "collaborationRequests",
      });
    }

    // *** ADDED: Project has many Messages (for the group chat) ***
    Project.hasMany(models.Message, {
      foreignKey: "projectId", // Key in Message pointing to Project
      as: "messages", // Alias to get messages for this project chat
    });
  };

  return Project;
};

export default ProjectModel;
