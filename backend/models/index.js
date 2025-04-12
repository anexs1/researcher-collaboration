import sequelize from "../config/db.js";

// Import all models
import User from "./User.js";
import Publication from "./publication.js";
import CollaborationRequest from "./CollaborationRequest.js";
import ProjectModel from "./projectModel.js"; // ✅ ADD THIS LINE

// Initialize models that use sequelize function style
const Project = ProjectModel(sequelize); // ✅ INIT THE MODEL

// Now, all your models should be inside the `models` object
const models = {
  User,
  Publication,
  CollaborationRequest,
  Project, // ✅ ADD THIS TO THE MODELS OBJECT
  // Add other models as needed
};

// --- Crucial Association Setup ---
console.log("Setting up model associations...");
Object.values(models).forEach((model) => {
  if (model.associate) {
    console.log(` - Calling associate for ${model.name}`);
    model.associate(models); // Pass the full models object for associations
  }
});
console.log("Model associations setup complete.");

// Export db with all models
const db = {
  ...models,
  sequelize,
};

export default db;
