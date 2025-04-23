// config/db.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// Initialize the Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql", // or 'postgres', 'sqlite', etc.
  }
);

// Function to connect to the database
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

// ✅ Default export for use in models/index.js
export default sequelize;
