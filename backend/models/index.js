// backend/models/index.js

import { Sequelize, DataTypes } from "sequelize"; // Import Sequelize class as well
import sequelize from "../config/db.js"; // Your configured sequelize instance

// Import all model definition functions
import UserModel from "./user.js";
import PublicationModel from "./Publication.js"; // Ensure correct casing if file is Publication.js
import CollaborationRequestModel from "./CollaborationRequest.js";
import MemberModel from "./Member.js";
import ProjectModel from "./project.js";
import CommentModel from "./comment.js"; // Import the Comment model

// Initialize the db object BEFORE using it
const db = {};

// Initialize ALL models and attach them directly to the db object
console.log("Initializing models...");
db.User = UserModel(sequelize, DataTypes);
db.Publication = PublicationModel(sequelize, DataTypes);
db.CollaborationRequest = CollaborationRequestModel(sequelize, DataTypes);
db.Project = ProjectModel(sequelize, DataTypes);
db.Member = MemberModel(sequelize, DataTypes);
db.Comment = CommentModel(sequelize, DataTypes);
console.log("Models initialized:", Object.keys(db).join(", "));

console.log("Setting up model associations...");
// Apply associations by iterating through the db object
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    console.log(`Associating model: ${modelName}`);
    db[modelName].associate(db); // Pass the full db object
  }
});
console.log("Model associations setup complete.");

// Add sequelize instance and Sequelize class to the db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Export the fully configured db object
export default db;
