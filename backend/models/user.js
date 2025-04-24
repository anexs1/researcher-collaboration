// backend/models/User.js
import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs"; // Ensure bcryptjs is imported

const UserModel = (sequelize) => {
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
          // Len validation might be better handled elsewhere if hashing changes length
          // len: [6, 100], // Consider removing length validation on hashed password
        },
        // Important: Do not select password by default (handled by scopes)
      },
      role: {
        type: DataTypes.ENUM(
          "user",
          "admin",
          "medical",
          "academic",
          "non-researcher"
        ),
        defaultValue: "user",
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "suspended"),
        allowNull: false,
        defaultValue: "pending",
      },
      // Add other profile fields if they exist in your migration/table
      // bio: { type: DataTypes.TEXT, allowNull: true },
      // profilePictureUrl: { type: DataTypes.STRING, allowNull: true },
      university: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
      companyName: { type: DataTypes.STRING, allowNull: true },
      jobTitle: { type: DataTypes.STRING, allowNull: true },
      medicalSpecialty: { type: DataTypes.STRING, allowNull: true },
      hospitalName: { type: DataTypes.STRING, allowNull: true },
      // Add fields for interests and socialLinks if they exist
      // interests: { type: DataTypes.JSON, allowNull: true }, // Or DataTypes.TEXT
      // socialLinks: { type: DataTypes.JSON, allowNull: true }, // Or DataTypes.TEXT
    },
    {
      timestamps: true,
      hooks: {
        // Hash password before saving
        beforeSave: async (user, options) => {
          // Pass options to hooks
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
      // --- ADD SCOPES ---
      scopes: {
        // Default scope excludes password
        defaultScope: {
          attributes: { exclude: ["password"] },
        },
        // Scope to include password when needed
        withPassword: {
          attributes: { include: ["password"] }, // Explicitly include
          // Or simply remove the default exclusion for this scope:
          // attributes: {},
        },
      },
      indexes: [{ fields: ["status"] }, { fields: ["role"] }],
      tableName: "Users", // Ensure this matches your actual table name
    }
  );

  // --- USE CONSISTENT METHOD NAME ---
  // Compare password instance method
  User.prototype.matchPassword = async function (candidatePassword) {
    // Ensure 'this.password' actually contains the hashed password
    // This relies on fetching the user with the 'withPassword' scope
    if (!this.password) {
      console.error(
        `Attempted matchPassword on user ${this.id} without password field fetched. Use 'withPassword' scope.`
      );
      // Throwing an error might be better than returning false
      throw new Error("Password field not available for comparison.");
      // return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Define associations
  User.associate = (models) => {
    // Keep your existing associations
    User.hasMany(models.Publication, {
      foreignKey: "authorId",
      as: "authoredPublications",
    });
    User.belongsToMany(models.Project, {
      through: models.Member,
      foreignKey: "userId",
      as: "projectMemberships",
    });
    User.hasMany(models.CollaborationRequest, {
      foreignKey: "requesterId",
      as: "sentRequests",
    });
    User.hasMany(models.Comment, {
      foreignKey: "userId",
      as: "comments", // Alias for fetching comments written by a user
    });
    // Add other associations if needed
  };

  return User;
};

export default UserModel;
