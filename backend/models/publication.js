// backend/models/publication.js
import { DataTypes } from "sequelize";

const PublicationModel = (sequelize) => {
  const Publication = sequelize.define(
    "Publication",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "users", // Make sure this matches your actual users table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      journal: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      doi: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      thumbnail: {
        type: DataTypes.STRING(2048),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      views: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      citations: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // 🆕 Additional Fields
      language: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "English",
      },
      version: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "v1.0",
      },
      isPeerReviewed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      license: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastReviewedAt: {
        type: DataTypes.DATE, // Use DataTypes.DATE for timestamp, DATEONLY for just date
        allowNull: true,
      },
      rating: {
        type: DataTypes.FLOAT, // Or DataTypes.DECIMAL(2,1) for more precision control
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: 0,
          max: 5,
        },
      },
      downloadCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // collaborationStatus: (REMOVED)
    },
    {
      timestamps: true,
      tableName: "publications", // Ensure this matches your DB table name
      indexes: [
        { fields: ["ownerId"] },
        { fields: ["area"] },
        { fields: ["publicationDate"] },
        // 🆕 Consider indexes for new sortable/filterable fields
        { fields: ["language"] },
        { fields: ["isPeerReviewed"] },
        { fields: ["rating"] },
        { fields: ["downloadCount"] },
      ],
    }
  );

  Publication.associate = (models) => {
    Publication.belongsTo(models.User, {
      foreignKey: "ownerId",
      as: "owner",
    });

    Publication.hasMany(models.Comment, {
      foreignKey: "publicationId",
      as: "comments",
      onDelete: "CASCADE",
    });

    Publication.belongsToMany(models.User, {
      through: "user_bookmarks", // Join table name
      foreignKey: "publicationId",
      otherKey: "userId",
      as: "bookmarkedBy",
      timestamps: true, // If your join table has createdAt/updatedAt
    });

    // 🆕 If you create a UserPublicationRating model for individual ratings:
    // Publication.hasMany(models.UserPublicationRating, {
    //   foreignKey: 'publicationId',
    //   as: 'userRatings'
    // });
  };

  return Publication;
};

export default PublicationModel;
