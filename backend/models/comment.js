// backend/models/comment.js
import { DataTypes } from "sequelize";

const CommentModel = (sequelize) => {
  const Comment = sequelize.define(
    "Comment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Comment content cannot be empty.",
          },
          len: {
            args: [1, 1000], // Min 1 char, Max 1000 chars (adjust as needed)
            msg: "Comment must be between 1 and 1000 characters.",
          },
        },
      },
      // Foreign Key for the User who wrote the comment
      userId: {
        type: DataTypes.INTEGER, // Ensure this matches the User ID type (e.g., INTEGER UNSIGNED if User ID is unsigned)
        allowNull: false,
        references: {
          model: "users", // <<< Name of the Users table (check case)
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Or 'SET NULL' if you want comments to remain if user deleted
      },
      // Foreign Key for the Publication the comment belongs to
      publicationId: {
        type: DataTypes.INTEGER, // Ensure this matches the Publication ID type
        allowNull: false,
        references: {
          model: "publications", // <<< Name of the Publications table
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // Delete comments if publication is deleted
      },
    },
    {
      timestamps: true, // Adds createdAt and updatedAt
      tableName: "comments", // Explicitly set table name
    }
  );

  Comment.associate = (models) => {
    // A Comment belongs to one User (Author)
    Comment.belongsTo(models.User, {
      foreignKey: "userId",
      as: "author", // Alias to fetch author details
    });

    // A Comment belongs to one Publication
    Comment.belongsTo(models.Publication, {
      foreignKey: "publicationId",
      as: "publication", // Alias if needed
    });
  };

  return Comment;
};

export default CommentModel;
