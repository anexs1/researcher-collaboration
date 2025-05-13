// backend/models/index.js

import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // Your configured sequelize instance

// Import all model definition functions
import UserModel from "./user.js";
import PublicationModel from "./publication.js";
import CollaborationRequestModel from "./CollaborationRequest.js";
import MemberModel from "./Member.js";
import ProjectModel from "./Project.js";
import CommentModel from "./comment.js"; // <<< Corrected filename if needed
import MessageModel from "./Message.js";
import GroupModel from "./Group.js"; // Keep if used
import SettingModel from "./Setting.js";
import UserBookmarkModel from "./UserBookmark.js"; // <<< IMPORT UserBookmark Model
import defineNotificationModel from "./notificationModel.js"; // <<<=== ADD THIS IMPORT for Notification Model
import DocumentModel from "./documentModel.js"; // Add this

const db = {};

// Initialize ALL models
console.log("Initializing models...");
db.User = UserModel(sequelize, DataTypes);
db.Publication = PublicationModel(sequelize, DataTypes);
db.CollaborationRequest = CollaborationRequestModel(sequelize, DataTypes);
db.Document = DocumentModel(sequelize, DataTypes); // Add this line

db.Project = ProjectModel(sequelize, DataTypes);
db.Member = MemberModel(sequelize, DataTypes);
db.Comment = CommentModel(sequelize, DataTypes); // <<< Use Corrected import
db.Message = MessageModel(sequelize, DataTypes);
db.Group = GroupModel(sequelize, DataTypes); // Keep if used
db.Setting = SettingModel(sequelize, DataTypes);
db.UserBookmark = UserBookmarkModel(sequelize, DataTypes); // <<< INITIALIZE UserBookmark Model
db.Notification = defineNotificationModel(sequelize); // <<<=== INITIALIZE NOTIFICATION MODEL
console.log("Models initialized:", Object.keys(db).join(", "));

// Apply associations
console.log("Setting up model associations...");
Object.keys(db).forEach((modelName) => {
  // Ensure the model exists AND has an associate method before calling it
  if (db[modelName] && db[modelName].associate) {
    console.log(`Associating model: ${modelName}`);
    db[modelName].associate(db); // Pass the full db object
  } else if (!db[modelName]) {
    console.warn(`Model ${modelName} not found during association setup.`);
  }
  // Add specific checks if a model doesn't have .associate
  // else if (db[modelName]) {
  //   console.log(`Model ${modelName} does not have an associate method.`);
  // }
});
console.log("Model associations setup complete.");

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
