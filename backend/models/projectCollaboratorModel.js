import { DataTypes } from "sequelize";

const CollaborationRequestModel = (sequelize) => {
  const CollaborationRequest = sequelize.define(
    "CollaborationRequest",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      projectId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Projects", key: "id" },
        onDelete: "CASCADE",
      },
      requesterId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      requestMessage: { type: DataTypes.TEXT, allowNull: true },
      responseMessage: { type: DataTypes.TEXT, allowNull: true },
      respondedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      timestamps: true,
      tableName: "joinrequests", // <<< Your actual table name
      underscored: false, // <<< Set based on your DB column naming (false for camelCase)
      freezeTableName: true,
      indexes: [
        { fields: ["projectId"] },
        { fields: ["requesterId"] },
        { fields: ["status"] },
        {
          unique: true,
          fields: ["projectId", "requesterId", "status"],
          where: { status: "pending" },
        },
      ],
    }
  );

  CollaborationRequest.associate = (models) => {
    CollaborationRequest.belongsTo(models.User, {
      foreignKey: "requesterId",
      as: "requester",
    });
    CollaborationRequest.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    });
  };

  return CollaborationRequest;
};

export default CollaborationRequestModel;
