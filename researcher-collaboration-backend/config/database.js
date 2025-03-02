const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("researcher_portal", "root", "", {
  // Replace with your MySQL credentials
  host: "localhost",
  dialect: "mysql",
  port: 3306, // Change to "postgres" if using PostgreSQL
  logging: false, // Disable logging for cleaner output
});

module.exports = sequelize;
