// models/publication.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Publication = sequelize.define(
  "Publication",
  {
    // Keep existing fields
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    abstract: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    document_link: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true, // Keep basic URL validation
      },
    },
    // Keep userId Foreign Key
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Keep this as false if new publications MUST have a user
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE", // Or 'SET NULL'/'RESTRICT' depending on desired behavior
    },
    // NOTE: createdAt and updatedAt are NOT explicitly defined here
  },
  {
    // --- Explicitly Disable Timestamps ---
    // This tells Sequelize NOT to automatically add/manage
    // `createdAt` and `updatedAt` columns for this model.
    // Therefore, it won't try to run the ALTER TABLE ADD command causing the error.
    timestamps: false,
    // -------------------------------------

    tableName: "publications",
    // underscored: false, // Use if your column names are camelCase (like userId)
  }
);

// Define Association (keep as is)
Publication.associate = (models) => {
  Publication.belongsTo(models.User, {
    foreignKey: "userId",
    as: "owner",
  });
};

export default Publication;
