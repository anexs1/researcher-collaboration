// backend/models/Member.js
import { DataTypes } from "sequelize";

const MemberModel = (sequelize) => {
  const Member = sequelize.define(
    "Member", // Model name (singular PascalCase)
    {
      // Assuming composite primary key (user_id, project_id)
      // If you have a separate 'id' PK column, uncomment it.
      // id: {
      //   type: DataTypes.INTEGER.UNSIGNED,
      //   primaryKey: true,
      //   autoIncrement: true,
      // },

      // --- Foreign Keys (camelCase in model) ---
      userId: {
        type: DataTypes.INTEGER.UNSIGNED, // Match User ID type
        allowNull: false,
        primaryKey: true, // Part of composite primary key
        references: { model: "Users", key: "id" }, // Add references for FK constraint definition
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      projectId: {
        type: DataTypes.INTEGER.UNSIGNED, // Match Project ID type
        allowNull: false,
        primaryKey: true, // Part of composite primary key
        references: { model: "Projects", key: "id" }, // Add references for FK constraint definition
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      // --- Additional Fields (camelCase in model) ---
      role: {
        type: DataTypes.STRING, // Or ENUM if you have fixed roles
        allowNull: false,
        defaultValue: "member", // Consistent with controller
      },
      status: {
        // Status of the membership
        type: DataTypes.ENUM("active", "invited", "pending", "inactive"), // Match DB ENUM values exactly
        allowNull: false,
        defaultValue: "active", // Default when created via controller
      },
      // --- Added joinedAt field to match DB column 'joined_at' ---
      joinedAt: {
        // camelCase model field name
        type: DataTypes.DATE,
        allowNull: false, // Assuming DB column is NOT NULL (Adjust if needed)
        defaultValue: DataTypes.NOW, // Set current time automatically on creation
        // 'field: joined_at' mapping is handled by underscored: true
      },

      // createdAt and updatedAt are added by `timestamps: true`
      // and mapped to created_at/updated_at by `underscored: true`
    },
    {
      // --- Model Options ---
      tableName: "project_members", // Exact table name
      timestamps: true, // Enable createdAt, updatedAt
      underscored: true, // Map camelCase fields to snake_case columns
      freezeTableName: true, // Prevent table name pluralization

      indexes: [
        // Composite unique key also serves as the primary key defined above
        {
          unique: true,
          primary: true, // Explicitly mark this index as the primary key constraint
          fields: ["user_id", "project_id"], // Use DB column names for index definition
        },
        // Optional separate indexes (often covered by PK)
        // { fields: ["user_id"] },
        // { fields: ["project_id"] },
      ],
    }
  );

  // --- Associations ---
  // Define associations if Member model needs to directly access User/Project
  // OR if User/Project use 'Member' as the 'through' model in belongsToMany
  Member.associate = (models) => {
    Member.belongsTo(models.User, {
      foreignKey: "userId", // FK in *this* model (maps to user_id)
      as: "user", // << Define alias needed for include in controller
    });
    Member.belongsTo(models.Project, {
      foreignKey: "projectId", // FK in *this* model (maps to project_id)
      as: "project", // << Define alias if needed elsewhere
    });
  };

  return Member;
};

export default MemberModel;
