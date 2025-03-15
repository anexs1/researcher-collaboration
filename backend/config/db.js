import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// Create a new Sequelize instance
export const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "mysql",
});

// Function to connect to the database
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};
