const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import the database connection

const Publication = sequelize.define("Publication", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

module.exports = Publication;
