import { DataTypes } from "sequelize";

const ProjectModel = (sequelize) => {
  const Project = sequelize.define(
    "Project", // Model name (PascalCase, singular)
    {
      // --- Fields based on your controller and likely DB structure ---
      id: {
        type: DataTypes.INTEGER.UNSIGNED, // Assuming UNSIGNED based on other models
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
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
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Project description cannot be empty." },
        },
      },
      // Foreign Key: ownerId relates to the User model
      ownerId: {
        type: DataTypes.INTEGER.UNSIGNED, // Match User ID type
        allowNull: false,
        // No 'field:' needed if DB column is 'ownerId' and underscored: false
        references: {
          model: "Users", // Exact name of the Users table
          key: "id",
        },
        onUpdate: "CASCADE", // Optional: Define behavior on User ID update
        onDelete: "CASCADE", // Optional: Delete Projects if Owner User is deleted
      },
      requiredCollaborators: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false, // Make required if it always needs a value
        defaultValue: 1,
        validate: {
          isInt: { msg: "Required collaborators must be a number." },
          min: { args: [0], msg: "Required collaborators cannot be negative." },
        },
      },
      status: {
        type: DataTypes.ENUM("Planning", "Active", "Completed", "On Hold"), // Match DB ENUM values exactly
        allowNull: false,
        defaultValue: "Planning",
      },
      // imageUrl: { // Uncomment and define if you handle image uploads
      //   type: DataTypes.STRING,
      //   allowNull: true,
      // },
      // createdAt and updatedAt are handled by timestamps option
    },
    {
      // --- Model Options ---
      tableName: "Projects", // Match your actual table name exactly
      timestamps: true, // Enable createdAt and updatedAt
      // === IMPORTANT: Set based on DB column names ===
      // If DB columns are camelCase (projectId, createdAt):
      underscored: false,
      // If DB columns are snake_case (project_id, created_at):
      // underscored: true,
      // =============================================
      freezeTableName: true, // Prevent Sequelize from pluralizing table name if it matches model name
      indexes: [
        { fields: ["ownerId"] }, // Index for faster owner lookups
        { fields: ["status"] }, // Index for faster status filtering
      ],
    }
  );

  // Define Associations
  Project.associate = (models) => {
    // A Project belongs to one User (Owner)
    Project.belongsTo(models.User, {
      foreignKey: "ownerId", // Key in THIS model (Project)
      as: "owner", // Alias used in includes: project.owner
    });

    // A Project can have many Collaboration Requests
    Project.hasMany(models.CollaborationRequest, {
      foreignKey: "projectId", // Key in the OTHER model (CollaborationRequest)
      as: "joinRequests", // Alias used in includes: project.joinRequests
      onDelete: "CASCADE", // If project deleted, delete associated requests
    });

    // A Project can have many Members (If using a Members model/join table)
    // Project.belongsToMany(models.User, {
    //   through: models.Member, // Your join table model name
    //   foreignKey: 'projectId', // Foreign key in Member table linking to Project
    //   otherKey: 'userId', // Foreign key in Member table linking to User
    //   as: 'members' // Alias: project.members
    // });

    // A Project can have many Tasks (If using a Task model)
    // Project.hasMany(models.Task, {
    //    foreignKey: 'projectId',
    //    as: 'tasks',
    //    onDelete: 'CASCADE'
    // });
  };

  return Project;
};

export default ProjectModel;
