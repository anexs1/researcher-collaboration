import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false, // Enable SQL query logging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test and sync database connection
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established");

    // Sync all models without dropping tables
    await sequelize.sync({ alter: true }); // This updates tables if model changes
    console.log("Database tables synced");

    return sequelize;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error; // Rethrow to handle in server.js
  }
};

export default sequelize;
