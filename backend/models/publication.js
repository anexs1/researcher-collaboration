// models/publication.js
import { DataTypes } from "sequelize";

const PublicationModel = (sequelize) => {
  const Publication = sequelize.define(
    "Publication",
    {
      id: {
        type: DataTypes.INTEGER, // Ensure this matches the type in your migration
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      author: {
        type: DataTypes.STRING, // Name(s) of authors as text
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.INTEGER, // *** IMPORTANT: MUST match User ID type (e.g., INTEGER UNSIGNED) ***
        allowNull: false,
        references: {
          model: "users", // Name of the users table (verify case)
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Deleting a user deletes their publications
      },
      document_link: {
        type: DataTypes.STRING(2048),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      area: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      publicationDate: {
        type: DataTypes.DATEONLY, // Stores only YYYY-MM-DD
        allowNull: true,
      },
      collaborationStatus: {
        type: DataTypes.ENUM("open", "in_progress", "closed"),
        allowNull: false,
        defaultValue: "open",
      },
      // Add other fields if they exist in your table/migration
      // e.g., views, citations, thumbnail
      // views: { type: DataTypes.INTEGER, defaultValue: 0 },
      // citations: { type: DataTypes.INTEGER, defaultValue: 0 },
      // thumbnail: { type: DataTypes.STRING, allowNull: true },
    },
    {
      timestamps: true, // Automatically adds createdAt, updatedAt
      tableName: "publications", // Explicit table name
      // Add indexes here if not done in migration
      // indexes: [ { fields: ['ownerId'] }, { fields: ['area'] } ]
    }
  );

  // --- Define ALL associations for Publication inside ONE associate method ---
  Publication.associate = (models) => {
    // 1. Publication belongs to one User (as owner)
    Publication.belongsTo(models.User, {
      foreignKey: "ownerId",
      as: "owner", // Alias used when fetching the owner user
    });

    // 2. Publication can have many Comments
    Publication.hasMany(models.Comment, {
      // Correctly associate with Comment model
      foreignKey: "publicationId",
      as: "comments", // Alias for fetching comments associated with this publication
      onDelete: "CASCADE", // Optional: Ensure comments are deleted when publication is deleted
    });

    // 3. Uncomment and add other associations if needed
    // Publication.hasMany(models.CollaborationRequest, {
    //   foreignKey: "publicationId",
    //   as: "collaborationRequests",
    // });
    // Publication.belongsToMany(models.Project, { through: 'ProjectPublications', /* ... */ });
  };

  return Publication;
};

export default PublicationModel;
