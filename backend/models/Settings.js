import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Settings = sequelize.define(
  "Settings",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    siteName: {
      type: DataTypes.STRING,
      defaultValue: "My App",
    },
    allowPublicSignup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    maintenanceMode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    defaultUserRole: {
      type: DataTypes.STRING,
      defaultValue: "user",
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    itemsPerPage: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    themeColor: {
      type: DataTypes.STRING,
      defaultValue: "#3b82f6",
    },
  },
  {
    tableName: "settings",
    timestamps: true,
  }
);

// Initialize default settings if table is empty
Settings.initDefaultSettings = async () => {
  const count = await Settings.count();
  if (count === 0) {
    await Settings.create({});
    console.log("Default settings initialized");
  }
};

export default Settings;
//
