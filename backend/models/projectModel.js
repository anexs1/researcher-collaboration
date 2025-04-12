// File: backend/models/projectModel.js

import { DataTypes } from "sequelize"; // Ensure this line is at the top

const ProjectModel = (sequelize) => {
  return sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "projects",
      timestamps: true,
    }
  );
};

export default ProjectModel;
