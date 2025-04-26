// backend/models/Member.js
import { DataTypes } from "sequelize";

const MemberModel = (sequelize) => {
  const Member = sequelize.define(
    "Member", // Model name (singular PascalCase)
    {
      // Assuming composite primary key (user_id, project_id)
      // If you have a separate 'id' PK column, uncomment it.

      // --- Foreign Keys (camelCase in model) ---
      userId: {
        type: DataTypes.INTEGER.UNSIGNED, // Match User ID type
        allowNull: false,
        primaryKey: true, // Part of composite primary key
      },
      projectId: {
        type: DataTypes.INTEGER.UNSIGNED, // Match Project ID type
        allowNull: false,
        primaryKey: true, // Part of composite primary key
      },

      // --- Additional Fields (camelCase in model) ---
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "member", // Changed default to 'member' for consistency with controller
        // Or keep 'Collaborator' if that's preferred, just be consistent
      },
      status: {
        // Status of the membership
        type: DataTypes.ENUM("active", "invited", "pending", "inactive"), // Match DB ENUM values
        allowNull: false,
        defaultValue: "active", // Default when created via controller
      },
      // --- Added joinedAt field to match DB column 'joined_at' ---
      joinedAt: {
        // camelCase model field name
        type: DataTypes.DATE,
        allowNull: false, // Assuming DB column is NOT NULL
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
      // primaryKey: true,          // This is usually inferred when fields have primaryKey: true
      // Keeping it doesn't hurt, but might be redundant. Can be removed.

      indexes: [
        // Composite unique key also serves as the primary key defined above
        {
          unique: true,
          primary: true, // Explicitly mark this index as the primary key constraint
          fields: ["user_id", "project_id"], // Use DB column names for index definition
        },
        // Optional: Add separate indexes on foreign keys if needed for performance,
        // though the PK index often covers lookups.
        // { fields: ["user_id"] },
        // { fields: ["project_id"] },
      ],
    }
  );

  // --- Associations ---
  // Define associations ONLY if the Member model represents more than just
  // the join record (e.g., if you query Member directly and need .getUser()/.getProject()).
  // If it's purely a join table for User.belongsToMany(Project), omit this.
  /*
  Member.associate = (models) => {
    Member.belongsTo(models.User, {
      foreignKey: "userId", // FK in *this* model (maps to user_id via underscored)
    });
    Member.belongsTo(models.Project, {
      foreignKey: "projectId", // FK in *this* model (maps to project_id via underscored)
    });
  };
  */

  return Member;
};

export default MemberModel;
