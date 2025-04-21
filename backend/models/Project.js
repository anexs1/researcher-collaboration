const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Project = sequelize.define(
  "Project",
  {
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    area: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "planning",
        "active",
        "on_hold",
        "completed",
        "closed"
      ),
      defaultValue: "planning",
    },
    collaboration_status: {
      type: DataTypes.ENUM("recruiting", "full", "active", "closed"),
      defaultValue: "recruiting",
    },
    collaborators_needed: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    approved_collaborators_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    start_date: {
      type: DataTypes.DATE,
    },
    end_date: {
      type: DataTypes.DATE,
    },
    deliverables: {
      type: DataTypes.TEXT,
    },
    tags: {
      type: DataTypes.JSON,
    },
  },
  {
    timestamps: true,
  }
);

// Define associations in your model initialization file or where you set up Sequelize
Project.associate = (models) => {
  Project.belongsToMany(models.User, {
    through: models.Member,
    foreignKey: "projectId",
    as: "members",
  });

  Project.hasMany(models.Member, {
    foreignKey: "projectId",
    as: "projectMembers",
  });
};

module.exports = Project;
