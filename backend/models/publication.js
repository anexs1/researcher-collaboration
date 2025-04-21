// models/publication.js
import { DataTypes } from "sequelize";

const PublicationModel = (sequelize) => {
  const Publication = sequelize.define(
    "Publication",
    {
      id: {
        type: DataTypes.INTEGER,
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
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
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
      collaborationStatus: {
        type: DataTypes.ENUM("open", "in_progress", "closed"),
        allowNull: false,
        defaultValue: "open",
      },
    },
    {
      timestamps: true,
      tableName: "publications",
    }
  );

  Publication.associate = (models) => {
    Publication.belongsTo(models.User, {
      foreignKey: "ownerId",
      as: "owner",
    });

    Publication.hasMany(models.CollaborationRequest, {
      foreignKey: "publicationId",
      as: "collaborationRequests",
    });
  };

  return Publication;
};

export default PublicationModel;
