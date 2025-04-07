// src/models/user.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // Assuming correct path
import bcrypt from "bcryptjs";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true, // <-- REMOVE THIS LINE AS WELL
      // WARNING: Database will NOT enforce username uniqueness.
      // Your application MUST handle this check before saving.
      validate: {
        notEmpty: true,
        len: [3, 30],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true, // <-- Keep this commented out or removed
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 100],
      },
    },
    role: {
      type: DataTypes.ENUM(
        "user",
        "admin",
        "medical",
        "academic",
        "non-researcher"
        // Add 'corporate' if needed
      ),
      defaultValue: "user",
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "suspended"),
      allowNull: false,
      defaultValue: "pending",
    },
    // Optional fields
    university: { type: DataTypes.STRING, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: true },
    companyName: { type: DataTypes.STRING, allowNull: true },
    jobTitle: { type: DataTypes.STRING, allowNull: true },
    medicalSpecialty: { type: DataTypes.STRING, allowNull: true },
    hospitalName: { type: DataTypes.STRING, allowNull: true },
  },
  {
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
    indexes: [
      // These explicit indexes might also contribute to the count
      { fields: ["status"] },
      { fields: ["role"] },
    ],
    tableName: "Users",
  }
);

// Password comparison method
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default User;
