// backend/models/Project.js
import { DataTypes } from "sequelize";

const ProjectModel = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      // --- Core Fields Matching Database ---
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255), // Assuming max length from previous model
        allowNull: false,
        validate: {
          notEmpty: { msg: "Project title cannot be empty." },
          len: {
            args: [5, 255],
            msg: "Title must be between 5 and 255 characters.",
          },
        },
      },
      description: {
        type: DataTypes.TEXT, // Assuming TEXT type
        allowNull: false,
        validate: {
          notEmpty: { msg: "Project description cannot be empty." },
        },
      },
      // Foreign Key: ownerId relates to the User model
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "ownerId", // Explicitly state DB column name if it differs from model key
        // Or remove if model key 'ownerId' matches DB column 'ownerId'
        references: {
          model: "Users", // Name of the target Users table
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Or 'SET NULL' or 'RESTRICT'
      },
      // Renamed field to match DB output 'requiredCollaborators'
      requiredCollaborators: {
        type: DataTypes.INTEGER.UNSIGNED, // Assuming UNSIGNED based on previous model
        allowNull: true, // Assuming nullable based on previous model
        defaultValue: 1, // Keep default if desired
        // No 'field:' mapping needed if model key matches DB column name exactly
        validate: {
          isInt: { msg: "Required collaborators must be a number." },
          min: { args: [0], msg: "Required collaborators cannot be negative." },
        },
      },
      status: {
        type: DataTypes.ENUM("Planning", "Active", "Completed", "On Hold"), // Keep ENUM if it exists
        // If status column doesn't exist, remove this field definition
        allowNull: false, // Assuming based on previous model
        defaultValue: "Planning", // Assuming based on previous model
      },
      // --- Removed fields NOT present in DB output ---
      // category, progress, duration, funding, skillsNeeded,
      // imageUrl, views, likes, comments
    },
    {
      tableName: "Projects", // Explicitly define table name
      timestamps: true, // Enables createdAt and updatedAt (Assuming they exist)
      // underscored: false, // Set to false or remove if not using automatic snake_case mapping
      indexes: [
        // Define indexes for columns that exist
        { fields: ["ownerId"] }, // Use model field name here
        // Add index for status if the column exists: { fields: ["status"] },
      ],
    }
  );

  // Define Associations
  Project.associate = (models) => {
    // A Project belongs to one User (Owner)
    Project.belongsTo(models.User, {
      foreignKey: "ownerId", // This is the key in the Project model referencing User
      as: "owner", // Alias to access the owner: project.owner
    });

    // --- Removed Member association as it wasn't confirmed ---
    // If you have a Members join table, add the belongsToMany association back here
  };

  return Project;
};

export default ProjectModel;
