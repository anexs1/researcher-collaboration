// models/CollaborationRequest.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const CollaborationRequest = sequelize.define(
  "CollaborationRequest", // Model name
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    publicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "publications", // Table name for Publication
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE", // If pub deleted, delete requests
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users", // Table name for User
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE", // If sender deleted, delete requests
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users", // Table name for User
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE", // If receiver deleted, delete requests
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected", "cancelled"),
      defaultValue: "pending",
      allowNull: false,
    },
    message: {
      // Optional message from sender
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "collaboration_requests", // Choose your table name
    timestamps: true, // Enable createdAt and updatedAt
  }
);

// Define Associations
CollaborationRequest.associate = (models) => {
  CollaborationRequest.belongsTo(models.Publication, {
    foreignKey: "publicationId",
    as: "publication",
  });
  CollaborationRequest.belongsTo(models.User, {
    foreignKey: "senderId",
    as: "sender",
  });
  CollaborationRequest.belongsTo(models.User, {
    foreignKey: "receiverId",
    as: "receiver",
  });
};

export default CollaborationRequest;
