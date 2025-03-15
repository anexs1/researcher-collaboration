import { DataTypes } from "sequelize"; // Import DataTypes
import { sequelize } from "../config/db.js"; // Correctly import the named export

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

export default Publication; // ✅ Use 'export default'
