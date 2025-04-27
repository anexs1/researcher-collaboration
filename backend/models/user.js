// backend/models/User.js
import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";

const UserModel = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      // --- Fields (camelCase - Matching DB Columns) ---
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { notEmpty: true, len: [3, 30] },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true, notEmpty: true },
      },
      password: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM(
          "user",
          "admin",
          "medical",
          "academic",
          "non-researcher"
        ),
        defaultValue: "user",
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "suspended"),
        allowNull: false,
        defaultValue: "pending",
      },
      // DB fields based on sample (camelCase)
      university: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
      companyName: { type: DataTypes.STRING, allowNull: true },
      jobTitle: { type: DataTypes.STRING, allowNull: true },
      medicalSpecialty: { type: DataTypes.STRING, allowNull: true },
      hospitalName: { type: DataTypes.STRING, allowNull: true },
      profilePictureUrl: { type: DataTypes.STRING, allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      // NOTE: Assuming firstName, lastName columns DO NOT exist in your DB based on error
      // firstName: { type: DataTypes.STRING, allowNull: true },
      // lastName: { type: DataTypes.STRING, allowNull: true },
    },
    {
      timestamps: true, // Expects createdAt, updatedAt columns
      hooks: {
        beforeSave: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
      scopes: {
        defaultScope: { attributes: { exclude: ["password"] } },
        withPassword: { attributes: {} },
      },
      indexes: [
        // Use model field names (camelCase)
        { fields: ["status"] },
        { fields: ["role"] },
        { unique: true, fields: ["email"] },
        { unique: true, fields: ["username"] },
      ],
      tableName: "Users",
      underscored: false, // <<< Set to FALSE because DB uses camelCase
    }
  );

  User.prototype.matchPassword = async function (candidatePassword) {
    if (!this.password) {
      throw new Error(
        "Password field not available (use 'withPassword' scope)."
      );
    }
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.associate = (models) => {
    // Associations use MODEL field names (camelCase) for foreign keys
    User.hasMany(models.Project, {
      foreignKey: "ownerId",
      as: "ownedProjects",
    });
    if (models.CollaborationRequest) {
      User.hasMany(models.CollaborationRequest, {
        foreignKey: "requesterId",
        as: "sentRequests",
      });
    }
    if (models.Publication) {
      User.hasMany(models.Publication, {
        foreignKey: "authorId",
        as: "authoredPublications",
      });
    }
    if (models.Comment) {
      User.hasMany(models.Comment, { foreignKey: "userId", as: "comments" });
    }

    // Many-to-Many with Project through Member
    if (models.Project && models.Member) {
      User.belongsToMany(models.Project, {
        through: models.Member,
        foreignKey: "userId",
        otherKey: "projectId",
        as: "memberProjects",
      });
      User.hasMany(models.Member, { foreignKey: "userId", as: "memberships" });
    }

    // *** ADDED Message Associations ***
    if (models.Message) {
      User.hasMany(models.Message, {
        foreignKey: "senderId",
        as: "sentMessages",
      });
      User.hasMany(models.Message, {
        foreignKey: "receiverId",
        as: "receivedMessages",
      });
    }
    // ********************************
  };

  return User;
};

export default UserModel;
