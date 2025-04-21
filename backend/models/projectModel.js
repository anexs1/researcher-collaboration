// File: backend/models/projectModel.js

import { DataTypes } from "sequelize";

const ProjectModel = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      // Define fields EXACTLY as they are in your database table
      id: {
        type: DataTypes.INTEGER, // Or DataTypes.UUID if using UUIDs
        primaryKey: true,
        autoIncrement: true, // Remove if using UUIDs
        // defaultValue: DataTypes.UUIDV4, // Add if using UUIDs
      },
      ownerId: {
        type: DataTypes.INTEGER, // Or DataTypes.UUID
        allowNull: false,
        references: {
          // Optional but good practice: define foreign key constraint
          model: "users", // Ensure this matches the actual table name for users
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Or SET NULL / RESTRICT depending on your needs
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false, // Or true if optional
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Planning", // Or whatever default makes sense
      },
      collaborators: {
        // Stores an array of user IDs (e.g., [1, 5, 10] or ["uuid1", "uuid5"])
        // Consider if a Many-to-Many relationship is more appropriate long-term
        type: DataTypes.JSON,
        allowNull: false, // Should ideally default to empty array
        defaultValue: [],
      },
      tags: {
        // Stores an array of strings (e.g., ["AI", "Healthcare"])
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      dueDate: {
        type: DataTypes.DATEONLY, // Just the date, no time
        allowNull: true,
      },
      // createdAt and updatedAt are handled by timestamps: true
    },
    {
      tableName: "projects", // Explicitly set table name
      timestamps: true, // Automatically adds createdAt and updatedAt
    }
  );

  // --- Associations Method ---
  Project.associate = (models) => {
    // A Project belongs to one User (as the owner)
    Project.belongsTo(models.User, {
      // models.User assumes your User model is named 'User'
      foreignKey: "ownerId", // The key in THIS table (projects) that points to User
      as: "owner", // The alias to use when including the owner
    });

    // --- IMPORTANT ---
    // If you want to properly query/include collaborators using Sequelize associations,
    // you need a Many-to-Many relationship with a join table (e.g., 'ProjectCollaborators').
    // The current JSON field approach makes querying difficult and inefficient.
    // Example of Many-to-Many setup (uncomment and adapt if you create the join table):
    // Project.belongsToMany(models.User, {
    //   through: 'ProjectCollaborators', // Name of the join table model/table
    //   as: 'collaboratorUsers',       // Alias for including collaborator user details
    //   foreignKey: 'projectId',       // Foreign key in join table linking to Project
    //   otherKey: 'userId'             // Foreign key in join table linking to User
    // });
  };
  // --- END ---

  return Project;
};

export default ProjectModel;
