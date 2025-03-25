// models/user.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // Import sequelize instance

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Make username unique
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true, // Ensure email is valid
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expertise: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false, // Disable timestamps (createdAt and updatedAt)
  }
);

// Define a method to find user by email
User.findUserByEmail = async function (email) {
  return await this.findOne({ where: { email } });
};

export default User;
