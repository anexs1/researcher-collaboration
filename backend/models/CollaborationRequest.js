// models/collaboration_request.js
import { DataTypes } from "sequelize";

const CollaborationRequestModel = (sequelize) => {
  const CollaborationRequest = sequelize.define(
    "CollaborationRequest",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      publicationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "publications",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      timestamps: true,
      tableName: "collaboration_requests",
    }
  );

  CollaborationRequest.associate = (models) => {
    CollaborationRequest.belongsTo(models.User, {
      foreignKey: "senderId",
      as: "sender",
    });

    CollaborationRequest.belongsTo(models.User, {
      foreignKey: "receiverId",
      as: "receiver",
    });

    CollaborationRequest.belongsTo(models.Publication, {
      foreignKey: "publicationId",
      as: "publication",
    });
  };

  return CollaborationRequest;
};

export default CollaborationRequestModel;
