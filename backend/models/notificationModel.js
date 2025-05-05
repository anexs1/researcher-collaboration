// backend/models/notificationModel.js
import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: "userId",
        as: "recipient", // Renamed for clarity - this is the recipient
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      // You could add other associations here if needed, e.g., relating
      // a notification directly to a Project or CollaborationRequest.
    }
  }

  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        // The ID of the user RECEIVING the notification
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        comment: "ID of the user who receives this notification.",
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment:
          "Category (e.g., NEW_COLLABORATION_REQUEST, REQUEST_RESPONSE).",
      },
      message: {
        // Optional: Pre-formatted text
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Pre-formatted notification message text (optional).",
      },
      data: {
        // Crucial for context and links
        type: DataTypes.JSON,
        allowNull: true,
        comment:
          "JSON object with relevant IDs/context (e.g., { projectId: 1, requesterId: 5 }).",
        get() {
          // Ensure data is always parsed from DB if stored as string
          const rawValue = this.getDataValue("data");
          if (rawValue && typeof rawValue === "string") {
            try {
              return JSON.parse(rawValue);
            } catch (e) {
              return null;
            }
          }
          return rawValue;
        },
      },
      readStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "True if the user has marked the notification as read.",
      },
      // createdAt and updatedAt are added by timestamps: true
    },
    {
      sequelize,
      modelName: "Notification",
      tableName: "Notifications",
      timestamps: true,
      indexes: [{ fields: ["userId"] }, { fields: ["userId", "readStatus"] }],
    }
  );

  return Notification;
};
