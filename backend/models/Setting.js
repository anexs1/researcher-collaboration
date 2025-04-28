// backend/models/Setting.js
import { DataTypes } from "sequelize";

const SettingModel = (sequelize) => {
  const Setting = sequelize.define(
    "Setting", // Model name (singular PascalCase)
    {
      // Assuming a single row identified by ID 1 for simplicity
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        defaultValue: 1, // Default to 1 if creating
        allowNull: false,
      },
      siteName: {
        type: DataTypes.STRING,
        allowNull: true, // Or false with a default?
        defaultValue: "Research Platform",
      },
      allowPublicSignup: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      maintenanceMode: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defaultUserRole: {
        type: DataTypes.STRING, // Use ENUM if roles are fixed
        allowNull: false,
        defaultValue: "user",
      },
      emailNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      itemsPerPage: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 10,
      },
      themeColor: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "#3b82f6",
      },
      // Add other settings fields here
    },
    {
      tableName: "settings", // Use lowercase table name
      timestamps: true, // Add createdAt, updatedAt
      underscored: false, // Use camelCase to match model fields
      freezeTableName: true,
    }
  );

  // No associations typically needed for a settings table unless linking elsewhere
  // Setting.associate = (models) => { };

  return Setting;
};

export default SettingModel;
