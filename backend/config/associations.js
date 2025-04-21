// config/associations.js
export function setupAssociations(db) {
  const { User, Project, Member } = db;

  // User-Project many-to-many through Member
  User.belongsToMany(Project, {
    through: Member,
    foreignKey: "user_id",
    as: "userProjects",
    otherKey: "project_id",
  });

  Project.belongsToMany(User, {
    through: Member,
    foreignKey: "project_id", // ✅ updated
    as: "projectTeam",
    otherKey: "user_id", // ✅ updated
  });

  // Member belongs to User
  Member.belongsTo(User, {
    foreignKey: "user_id", // ✅ updated
    as: "memberUser",
  });

  // Member belongs to Project
  Member.belongsTo(Project, {
    foreignKey: "project_id", // ✅ updated
    as: "memberProject",
  });

  // Project has many Members
  Project.hasMany(Member, {
    foreignKey: "project_id",
    as: "projectMemberRelations",
  });
  // User has many Members
  User.hasMany(Member, {
    foreignKey: "user_id", // ✅ updated
    as: "userMemberRelations",
  });

  console.log("Database associations configured successfully");
}
