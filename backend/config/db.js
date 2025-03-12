// db.js
const { Sequelize } = require("sequelize");

// Initialize Sequelize
const sequelize = new Sequelize("researcher_portal", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = sequelize;
