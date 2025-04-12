import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

// Function to connect to the database
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

// Default export for Sequelize instance
export default sequelize;
