// backend/models/User.js
import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";

const UserModel = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
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
      university: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
      companyName: { type: DataTypes.STRING, allowNull: true },
      jobTitle: { type: DataTypes.STRING, allowNull: true },
      medicalSpecialty: { type: DataTypes.STRING, allowNull: true },
      hospitalName: { type: DataTypes.STRING, allowNull: true },
      profilePictureUrl: { type: DataTypes.STRING, allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
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
        // Exclude password by default
        defaultScope: { attributes: { exclude: ["password"] } },
        // Scope to explicitly include password when needed (e.g., login)
        withPassword: { attributes: {} },
      },
      indexes: [
        { fields: ["status"] },
        { fields: ["role"] },
        { unique: true, fields: ["email"] },
        { unique: true, fields: ["username"] },
      ],
      tableName: "Users", // Make sure this matches your DB table name
      // Set based on your Users table column naming (e.g., profilePictureUrl vs profile_picture_url)
      underscored: false, // <<< ADJUST THIS based on your Users table columns
    }
  );

  User.prototype.matchPassword = async function (candidatePassword) {
    // Ensure password was fetched (use .scope('withPassword') when finding user for login)
    if (!this.password) {
      throw new Error(
        "Password field not available for comparison. Use 'withPassword' scope when fetching user."
      );
    }
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.associate = (models) => {
    // User owns Projects
    User.hasMany(models.Project, {
      foreignKey: "ownerId",
      as: "ownedProjects",
    });

    // User sends CollaborationRequests
    if (models.CollaborationRequest) {
      User.hasMany(models.CollaborationRequest, {
        foreignKey: "requesterId",
        as: "sentRequests",
      });
    }

    // User authors Publications
    if (models.Publication) {
      User.hasMany(models.Publication, {
        foreignKey: "authorId",
        as: "authoredPublications",
      });
    }

    // User makes Comments
    if (models.Comment) {
      User.hasMany(models.Comment, { foreignKey: "userId", as: "comments" });
    }

    // User is a Member of many Projects (through Member table)
    if (models.Project && models.Member) {
      User.belongsToMany(models.Project, {
        through: models.Member, // Join table
        foreignKey: "userId", // Key in Member pointing to User
        otherKey: "projectId", // Key in Member pointing to Project
        as: "memberProjects", // Alias to get projects user is member of
      });
      // User has many direct Membership records
      User.hasMany(models.Member, { foreignKey: "userId", as: "memberships" });
    }

    // User sends Messages
    if (models.Message) {
      User.hasMany(models.Message, {
        foreignKey: "senderId", // Key in Message pointing to User
        as: "sentMessages",
      });
      // NO receivedMessages association needed, as messages belong to projects now
    }
  };

  return User;
};

export default UserModel;
