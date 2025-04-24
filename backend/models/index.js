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
// This ensures all models are defined before associations are called
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    console.log(`Associating model: ${modelName}`);
    // Pass the full db object containing all initialized models
    db[modelName].associate(db);
  } else {
    // console.log(`Model ${modelName} has no associate method.`); // Optional log
  }
});
console.log("Model associations setup complete.");

// Add sequelize instance and Sequelize class to the db object
// (Useful for raw queries or accessing Sequelize constants)
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Export the fully configured db object
export default db;
