// backend/models/Member.js
import { DataTypes } from "sequelize";

const MemberModel = (sequelize) => {
  const Member = sequelize.define(
    "Member", // Model name (singular PascalCase)
    {
      // Assuming you don't need a separate primary 'id' for the join table itself,
      // The combination of user_id and project_id can be the primary key.
      // If you DO have an 'id' column, uncomment this:
      // id: {
      //   type: DataTypes.INTEGER.UNSIGNED,
      //   primaryKey: true,
      //   autoIncrement: true,
      // },

      // Foreign Keys - defined here but primarily configured in association
      userId: {
        // Use camelCase in the model
        type: DataTypes.INTEGER.UNSIGNED, // Match User ID type
        allowNull: false,
        // References are typically set in the association, not duplicated here
        // references: { model: 'Users', key: 'id' }
      },
      projectId: {
        // Use camelCase in the model
        type: DataTypes.INTEGER.UNSIGNED, // Match Project ID type
        allowNull: false,
        // references: { model: 'Projects', key: 'id' }
      },

      // Additional fields on the join table
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Collaborator", // Or 'member' - be consistent
        // 'field: "role"' is handled by underscored: true if DB is snake_case
      },
      status: {
        // Status of the membership (e.g., active, invited, requested - might overlap with CollaborationRequest)
        type: DataTypes.ENUM("active", "invited", "pending", "inactive"), // Example statuses
        allowNull: false,
        defaultValue: "active",
        // 'field: "status"' handled by underscored: true
      },
      // joinedAt is usually derived from createdAt if timestamps are enabled
      // joined_at: {
      //   type: DataTypes.DATE,
      //   allowNull: false,
      //   defaultValue: DataTypes.NOW,
      // },

      // createdAt and updatedAt will be added by timestamps: true
      // and mapped to created_at/updated_at by underscored: true
    },
    {
      tableName: "project_members", // <<< Ensure this is your exact join table name
      timestamps: true, // Enable createdAt, updatedAt
      underscored: true, // <<< Use snake_case for columns (user_id, project_id, created_at, etc.)
      freezeTableName: true,
      // Define a composite primary key
      // Remove this if you have a separate auto-incrementing 'id' column
      primaryKey: true, // Indicate that the combo below is the PK
      indexes: [
        // Composite unique key ensures a user is only in a project once
        { unique: true, fields: ["user_id", "project_id"] }, // Use DB column names here for index
      ],
    }
  );

  // Associations are defined in User and Project models for Many-to-Many
  // You generally don't define the belongsTo here for a simple join table model
  // UNLESS 'Member' represents more than just the join record (e.g., it has its own properties beyond FKs and role/status).
  // If it's JUST a join table, the belongsToMany in User/Project is sufficient.
  // If 'Member' IS a distinct entity, then these are correct:
  /*
  Member.associate = (models) => {
    Member.belongsTo(models.User, {
      foreignKey: "userId", // FK in *this* model (maps to user_id via underscored)
      // No 'as' needed unless User needs multiple Member associations
    });
    Member.belongsTo(models.Project, {
      foreignKey: "projectId", // FK in *this* model (maps to project_id via underscored)
      // No 'as' needed unless Project needs multiple Member associations
    });
  };
  */

  return Member;
};

export default MemberModel;
