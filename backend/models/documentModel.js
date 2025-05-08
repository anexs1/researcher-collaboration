// backend/models/documentModel.js
import { DataTypes } from "sequelize";

const DocumentModel = (sequelize) => {
  const Document = sequelize.define(
    "Document",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Untitled Document",
      },
      projectId: {
        // Optional: If documents are linked to your existing projects
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true, // Or false if always linked
        references: {
          model: "Projects", // Make sure this matches your Projects table name
          key: "id",
        },
        onDelete: "SET NULL", // Or 'CASCADE' if documents should be deleted with project
        onUpdate: "CASCADE",
      },
      ownerId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "Users", // Make sure this matches your Users table name
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      content: {
        // Store Slate.js content as JSON. Using TEXT, consider LONGTEXT for larger docs.
        type: DataTypes.TEXT("long"),
        allowNull: true,
        defaultValue: JSON.stringify([
          // Default empty Slate structure
          { type: "paragraph", children: [{ text: "" }] },
        ]),
        get() {
          const rawValue = this.getDataValue("content");
          try {
            return rawValue ? JSON.parse(rawValue) : null;
          } catch (error) {
            console.error("Error parsing document content JSON:", error);
            return [
              {
                type: "paragraph",
                children: [{ text: "Error loading content." }],
              },
            ];
          }
        },
        set(value) {
          this.setDataValue("content", JSON.stringify(value));
        },
      },
      // Add more fields as needed: lastEditedBy, accessSettings, etc.
    },
    {
      timestamps: true, // Adds createdAt and updatedAt
      tableName: "documents", // Explicitly set table name
    }
  );

  Document.associate = (models) => {
    Document.belongsTo(models.User, {
      foreignKey: "ownerId",
      as: "owner",
    });
    if (models.Project) {
      // Conditionally associate if Project model exists
      Document.belongsTo(models.Project, {
        foreignKey: "projectId",
        as: "project",
      });
    }
  };

  return Document;
};

export default DocumentModel;
