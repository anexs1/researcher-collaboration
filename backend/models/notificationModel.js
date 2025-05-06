import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: "userId", // The user receiving the notification
        as: "recipient",
        onDelete: "CASCADE",
      });
      // Optional: Add association to User who triggered it (if needed)
      // Notification.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
    }
  }

  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED, // Use UNSIGNED if DB supports it
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        // ID of the recipient
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "Users", key: "id" }, // Ensure 'Users' is your actual user table name
        onDelete: "CASCADE",
        comment: "ID of the user who receives this notification.",
      },
      type: {
        // e.g., 'NEW_COLLAB_JOIN_REQUEST', 'COLLAB_REQUEST_RESPONSE', 'NEW_MESSAGE'
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Category of the notification.",
      },
      message: {
        // Pre-formatted text for display
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Pre-formatted notification message text.",
      },
      data: {
        // JSON blob for context (IDs, names, etc.)
        type: DataTypes.JSON,
        allowNull: true,
        comment:
          "JSON object with relevant IDs/context (e.g., { projectId: 1, requesterId: 5 }).",
        get() {
          // Ensure data is always parsed from DB string
          const rawValue = this.getDataValue("data");
          try {
            return rawValue && typeof rawValue === "string"
              ? JSON.parse(rawValue)
              : rawValue;
          } catch (e) {
            console.error(
              "Error parsing notification data JSON:",
              e,
              "Raw:",
              rawValue
            );
            return null;
          }
        },
      },
      readStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "True if the user has marked the notification as read.",
      },
      // createdAt, updatedAt added by timestamps: true
    },
    {
      sequelize,
      modelName: "Notification",
      tableName: "Notifications", // Or your preferred table name
      timestamps: true, // Adds createdAt and updatedAt
      underscored: false, // Assume camelCase columns unless DB uses snake_case
      indexes: [
        { fields: ["userId"] }, // Index for fetching user's notifications
        { fields: ["userId", "readStatus"] }, // Index for fetching unread count/notifications
      ],
    }
  );

  return Notification;
};
