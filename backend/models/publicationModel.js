const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Corrected path to db.js

const Publication = sequelize.define("Publication", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  keywords: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Publication;
