// models/projectCollaboratorModel.js
export default (sequelize) => {
  const ProjectCollaborator = sequelize.define(
    "ProjectCollaborator",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: "member",
      },
    },
    {
      tableName: "project_collaborators",
    }
  );

  return ProjectCollaborator;
};
