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
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 30],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
      // Ensure all roles from your signup forms are included
      type: DataTypes.ENUM(
        "user",
        "admin",
        "medical",
        "academic",
        "non-researcher"
      ),
      defaultValue: "user",
    },
    // --- ADDED STATUS FIELD ---
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "suspended"),
      allowNull: false,
      defaultValue: "pending", // New users start as pending
    },
    // --- Optional but recommended: Add fields from specific signup forms ---
    university: { type: DataTypes.STRING, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: true },
    companyName: { type: DataTypes.STRING, allowNull: true },
    jobTitle: { type: DataTypes.STRING, allowNull: true },
    medicalSpecialty: { type: DataTypes.STRING, allowNull: true },
    hospitalName: { type: DataTypes.STRING, allowNull: true },
    // researchInterests: { type: DataTypes.TEXT, allowNull: true },
    // publicationLinks: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    hooks: {
      // Password hashing hook (remains the same)
      beforeSave: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
    indexes: [
      // Optional: Add indexes for performance
      { fields: ["status"] },
      { fields: ["role"] },
    ],
  }
);

// Password comparison method (remains the same)
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default User;
