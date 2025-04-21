import { DataTypes } from "sequelize";

const Member = (sequelize) => {
  const model = sequelize.define(
    "Member",
    {
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Collaborator",
        field: "role", // Explicit field name
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
        field: "status", // Explicit field name
      },
      joined_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "joined_at", // Explicit field name
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "created_at", // Explicit field name
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "updated_at", // Explicit field name
      },
    },
    {
      tableName: "project_members",
      timestamps: true, // Keep timestamps enabled
      createdAt: "created_at", // Explicitly map to created_at column
      updatedAt: "updated_at", // Explicitly map to updated_at column
      underscored: true, // Use snake_case for all fields
      freezeTableName: true, // Prevent pluralization
    }
  );

  model.associate = (models) => {
    model.belongsTo(models.User, {
      foreignKey: {
        name: "user_id",
        allowNull: false,
      },
    });
    model.belongsTo(models.Project, {
      foreignKey: {
        name: "project_id",
        allowNull: false,
      },
    });
  };

  return model;
};

export default Member;
