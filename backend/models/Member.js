// backend/models/Member.js
import { DataTypes } from "sequelize";

const MemberModel = (sequelize) => {
  const Member = sequelize.define(
    "Member",
    {
      // --- Fields (camelCase in model) ---
      userId: {
        // Maps to user_id
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "Users", key: "id" }, // <<< Define reference for constraint
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      projectId: {
        // Maps to project_id
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "Projects", key: "id" }, // <<< Define reference for constraint
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "member",
      }, // Maps to role
      status: {
        type: DataTypes.ENUM("active", "invited", "pending", "inactive"),
        allowNull: false,
        defaultValue: "active",
      }, // Maps to status
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      }, // Maps to joined_at
      // createdAt maps to created_at
      // updatedAt maps to updated_at
    },
    {
      tableName: "project_members", // <<< Ensure this matches your DB table
      timestamps: true, // Expects created_at, updated_at columns
      underscored: true, // <<< Set to TRUE because DB uses snake_case
      freezeTableName: true,
      indexes: [
        { unique: true, primary: true, fields: ["user_id", "project_id"] },
      ], // Use DB column names
    }
  );

  Member.associate = (models) => {
    // Associations use MODEL field names (camelCase) for foreign keys
    Member.belongsTo(models.User, { foreignKey: "userId", as: "user" }); // userId maps to user_id
    Member.belongsTo(models.Project, {
      foreignKey: "projectId",
      as: "project",
    }); // projectId maps to project_id
  };

  return Member;
};

export default MemberModel;
