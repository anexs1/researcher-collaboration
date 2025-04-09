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
      validate: {
        notEmpty: true,
        len: [3, 30],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
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
    indexes: [{ fields: ["status"] }, { fields: ["role"] }],
    tableName: "Users", // Ensure this matches your actual table name 'users' or 'Users'
    // Conventionally lowercase 'users' is common. If it's 'users', change here.
  }
);

// Password comparison method
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// --- ADD THIS ASSOCIATION METHOD ---
User.associate = (models) => {
  // A User (as owner) has many Publications
  User.hasMany(models.Publication, {
    foreignKey: "ownerId", // This is the foreign key column in the 'publications' table
    as: "publications", // Alias to use when querying User and including publications
  });

  // A User (as sender) has many CollaborationRequests
  User.hasMany(models.CollaborationRequest, {
    foreignKey: "senderId", // Foreign key in the 'collaboration_requests' table
    as: "sentRequests", // Alias for requests sent by this user
  });

  // A User (as receiver) has many CollaborationRequests
  User.hasMany(models.CollaborationRequest, {
    foreignKey: "receiverId", // Foreign key in the 'collaboration_requests' table
    as: "receivedRequests", // Alias for requests received by this user
  });
};
// --- END ASSOCIATION METHOD ---

export default User;
