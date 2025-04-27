// backend/models/index.js

import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // Your configured sequelize instance

// Import all model definition functions
import UserModel from "./User.js"; // Use consistent naming
import PublicationModel from "./Publication.js";
import CollaborationRequestModel from "./CollaborationRequest.js";
import MemberModel from "./Member.js";
import ProjectModel from "./Project.js"; // Use consistent naming
import CommentModel from "./Comment.js";
import MessageModel from "./Message.js"; // <<< Import Message model

const db = {};

// Initialize ALL models
console.log("Initializing models...");
db.User = UserModel(sequelize, DataTypes);
db.Publication = PublicationModel(sequelize, DataTypes);
db.CollaborationRequest = CollaborationRequestModel(sequelize, DataTypes);
db.Project = ProjectModel(sequelize, DataTypes);
db.Member = MemberModel(sequelize, DataTypes);
db.Comment = CommentModel(sequelize, DataTypes);
db.Message = MessageModel(sequelize, DataTypes); // <<< Initialize Message
console.log("Models initialized:", Object.keys(db).join(", "));

// Apply associations
console.log("Setting up model associations...");
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    console.log(`Associating model: ${modelName}`);
    db[modelName].associate(db); // Pass the full db object
  }
});
console.log("Model associations setup complete.");

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
