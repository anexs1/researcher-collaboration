// models/publication.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Publication = sequelize.define(
  "Publication",
  {
    // --- Define Primary Key ---
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // --- Core Fields ---
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    summary: {
      // << Use summary (rename from abstract)
      type: DataTypes.TEXT,
      allowNull: false, // Assuming required
    },
    author: {
      // Author string field
      type: DataTypes.STRING,
      allowNull: false,
    },
    // --- Foreign Key to User (Owner) ---
    ownerId: {
      // <<< RENAMED field to ownerId for consistency
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users", // <<< IMPORTANT: Ensure this is your exact users table name
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    // --- Link Field ---
    document_link: {
      type: DataTypes.STRING(2048), // Allow longer URLs
      allowNull: true, // Make nullable if not always required
      validate: {
        isUrl: true,
      },
    },
    // --- Fields for Explore/Filtering ---
    tags: {
      type: DataTypes.JSON, // Use JSON type (Requires MySQL 5.7.8+)
      // Alternatively: type: DataTypes.TEXT, // Store as comma-separated string
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    publicationDate: {
      type: DataTypes.DATEONLY, // Store just the date
      allowNull: true, // Or false if always required
    },
    collaborationStatus: {
      type: DataTypes.ENUM("open", "in_progress", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    // NOTE: createdAt and updatedAt are handled by timestamps: true below
  },
  {
    // --- Enable Timestamps ---
    timestamps: true, // <<< CHANGED to true: Sequelize manages createdAt/updatedAt
    // ----------------------
    tableName: "publications", // Ensure this is your exact table name
  }
);

// --- Define Associations ---
Publication.associate = (models) => {
  // This publication belongs to one User (the owner)
  Publication.belongsTo(models.User, {
    foreignKey: "ownerId", // <<< CORRECT: Matches the field definition above
    as: "owner", // <<< CORRECT: Matches the alias used in controller include
  });

  // This publication can have many Collaboration Requests
  Publication.hasMany(models.CollaborationRequest, {
    foreignKey: "publicationId", // Foreign key in collaboration_requests table
    as: "collaborationRequests", // Alias for accessing requests from a publication
  });
};
// --- End Associations ---

export default Publication;
