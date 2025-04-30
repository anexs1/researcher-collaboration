// backend/models/comment.js
import { DataTypes } from "sequelize";

const CommentModel = (sequelize) => {
  const Comment = sequelize.define(
    "Comment",
    {
      id: {
        // Assuming comments.id is likely INT (signed) auto-increment in DB
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT, // Matches common practice for comment content
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Comment content cannot be empty.",
          },
          len: {
            args: [1, 2000], // Adjust max length as needed
            msg: "Comment must be between 1 and 2000 characters.",
          },
        },
      },
      // Foreign Key for the User who wrote the comment
      userId: {
        // *** CRITICAL FIX: Match users.id type ***
        type: DataTypes.INTEGER.UNSIGNED, // Matches DB int(10) unsigned
        allowNull: false,
        references: {
          model: "users", // Ensure this matches the actual users table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Decide: CASCADE or SET NULL (if userId allows NULL)
      },
      // Foreign Key for the Publication the comment belongs to
      publicationId: {
        // *** Match publications.id type ***
        type: DataTypes.INTEGER, // Matches DB int(11) (signed)
        allowNull: false,
        references: {
          model: "publications", // Ensure this matches the actual publications table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Usually correct: delete comments if publication is deleted
      },
      // createdAt and updatedAt are handled by timestamps: true
    },
    {
      timestamps: true, // Adds createdAt and updatedAt
      tableName: "comments", // Explicitly set table name to match DB
      // Add indexes if needed, mirroring the DB
      indexes: [
        { fields: ["publicationId", "createdAt"] }, // Good for fetching comments ordered
        { fields: ["userId"] },
      ],
    }
  );

  Comment.associate = (models) => {
    // A Comment belongs to one User (Author)
    Comment.belongsTo(models.User, {
      foreignKey: "userId",
      as: "author", // Alias to fetch author details easily (e.g., include: [{ model: db.User, as: 'author' }])
    });

    // A Comment belongs to one Publication
    Comment.belongsTo(models.Publication, {
      foreignKey: "publicationId",
      as: "publication", // Alias if needed when fetching comment's publication
    });
  };

  return Comment;
};

export default CommentModel;
