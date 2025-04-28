// backend/models/GroupMember.js
import { DataTypes } from "sequelize";

const GroupMemberModel = (sequelize) => {
  const GroupMember = sequelize.define(
    "GroupMember",
    {
      id: {
        // Optional primary key for the join table itself
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      groupId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Groups", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      // Optional: Add role ('admin', 'member') or joined date
      // role: {
      //   type: DataTypes.ENUM('admin', 'member'),
      //   defaultValue: 'member',
      //   allowNull: false
      // },
      // joinedAt: {
      //    type: DataTypes.DATE,
      //    defaultValue: DataTypes.NOW
      // }
    },
    {
      tableName: "GroupMembers", // Or UserGroups
      timestamps: true, // Add createdAt, updatedAt for when the membership was created/updated
      underscored: false,
      freezeTableName: true,
      // Unique constraint to prevent duplicate memberships
      indexes: [{ unique: true, fields: ["userId", "groupId"] }],
    }
  );

  // No associate function typically needed here unless it has relationships
  // TO other tables besides User and Group. The belongsToMany handles the link.
  // GroupMember.associate = (models) => {
  //    // Define associations here if needed
  // };

  return GroupMember;
};

export default GroupMemberModel;
