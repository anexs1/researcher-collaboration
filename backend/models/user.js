// models/User.js
import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";

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
        ),
        defaultValue: "user",
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
      tableName: "Users",
    }
  );

  // Compare password instance method
  User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Define associations
  User.associate = (models) => {
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

    User.hasMany(models.CollaborationRequest, {
      foreignKey: "recipientId",
      as: "receivedRequests",
    });
  };

  return User;
};

export default UserModel;
