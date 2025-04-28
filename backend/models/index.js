// backend/models/index.js

import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // Your configured sequelize instance

// Import all model definition functions
import UserModel from "./User.js";
import PublicationModel from "./Publication.js";
import CollaborationRequestModel from "./CollaborationRequest.js";
import MemberModel from "./Member.js";
import ProjectModel from "./Project.js";
import CommentModel from "./Comment.js";
import MessageModel from "./Message.js";
// Keep GroupModel if you are actually using Groups elsewhere, otherwise consider removing
import GroupModel from "./Group.js";
import SettingModel from "./Setting.js"; // <<<--- IMPORT the Setting model

const db = {};

// Initialize ALL models
console.log("Initializing models...");
db.User = UserModel(sequelize, DataTypes);
db.Publication = PublicationModel(sequelize, DataTypes);
db.CollaborationRequest = CollaborationRequestModel(sequelize, DataTypes);
db.Project = ProjectModel(sequelize, DataTypes);
db.Member = MemberModel(sequelize, DataTypes);
db.Comment = CommentModel(sequelize, DataTypes);
db.Message = MessageModel(sequelize, DataTypes);
// Keep Group if needed, otherwise remove
db.Group = GroupModel(sequelize, DataTypes);
db.Setting = SettingModel(sequelize, DataTypes); // <<<--- INITIALIZE the Setting model
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
});
console.log("Model associations setup complete.");

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
