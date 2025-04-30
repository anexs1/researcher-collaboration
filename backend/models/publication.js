// backend/models/publication.js
import { DataTypes } from "sequelize";

const PublicationModel = (sequelize) => {
  const Publication = sequelize.define(
    "Publication",
    {
      id: {
        type: DataTypes.INTEGER, // Matches DB type int(11) (signed)
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING, // Matches DB varchar(255)
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT, // Matches DB text
        allowNull: false, // Assuming summary is required based on DB 'NO' for Null
      },
      author: {
        type: DataTypes.STRING, // Matches DB varchar(255)
        allowNull: false,
      },
      ownerId: {
        // *** CRITICAL FIX: Match users.id type ***
        type: DataTypes.INTEGER.UNSIGNED, // Matches DB int(10) unsigned
        allowNull: false,
        references: {
          model: "users", // Ensure this matches the actual users table name (case-sensitive if applicable)
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Or consider SET NULL/RESTRICT based on requirements
      },
      document_link: {
        type: DataTypes.STRING(2048), // Matches DB varchar(2048)
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      tags: {
        // Note: DB type is longtext. DataTypes.JSON often works but isn't a perfect match.
        // Consider changing DB type to JSON if possible, or use DataTypes.TEXT here.
        type: DataTypes.JSON,
        allowNull: true,
      },
      area: {
        type: DataTypes.STRING, // Matches DB varchar(255)
        allowNull: true,
      },
      publicationDate: {
        type: DataTypes.DATEONLY, // Matches DB date (stores YYYY-MM-DD)
        allowNull: true,
      },
      collaborationStatus: {
        type: DataTypes.ENUM("open", "in_progress", "closed"), // Matches DB enum
        allowNull: false,
        defaultValue: "open", // Matches DB default
      },
      journal: {
        type: DataTypes.STRING, // Matches DB varchar(255)
        allowNull: true,
      },
      doi: {
        type: DataTypes.STRING, // Matches DB varchar(255)
        allowNull: true,
        unique: true, // Assuming DOI should be unique if provided
      },
      // --- Added missing fields ---
      thumbnail: {
        type: DataTypes.STRING(2048), // Matches DB varchar(2048)
        allowNull: true,
        validate: {
          isUrl: true, // Optional validation
        },
      },
      views: {
        type: DataTypes.INTEGER, // Matches DB int(11) (signed)
        allowNull: false,
        defaultValue: 0,
      },
      citations: {
        type: DataTypes.INTEGER, // Matches DB int(11) (signed)
        allowNull: false,
        defaultValue: 0,
      },
      // createdAt and updatedAt are handled by timestamps: true
    },
    {
      timestamps: true, // Automatically adds createdAt, updatedAt
      tableName: "publications", // Explicit table name matches DB
      // Add indexes here mirroring your DB structure if needed, or rely on migrations
      indexes: [
        { fields: ["ownerId"] },
        { fields: ["collaborationStatus"] },
        // Add other relevant indexes like publicationDate, area, etc.
      ],
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
      foreignKey: "publicationId",
      as: "comments", // Alias for fetching comments associated with this publication
      onDelete: "CASCADE", // Ensures comments are deleted when publication is deleted
    });

    // 3. Publication can have many Bookmarks (indirectly via UserBookmarks)
    // This association allows fetching users who bookmarked this publication
    Publication.belongsToMany(models.User, {
      through: "user_bookmarks", // The name of the join table
      foreignKey: "publicationId", // Foreign key in the join table that points to Publication
      otherKey: "userId", // Foreign key in the join table that points to User
      as: "bookmarkedBy", // Alias to get the list of users
      timestamps: true, // If user_bookmarks has createdAt/updatedAt managed by Sequelize
    });

    // Add other associations like CollaborationRequests if needed
    // Publication.hasMany(models.CollaborationRequest, { ... });
  };

  return Publication;
};

export default PublicationModel;
