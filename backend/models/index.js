// models/index.js (Example)
import sequelize from "../config/db.js";
import User from "./User.js";
import Publication from "./publication.js";
import CollaborationRequest from "./CollaborationRequest.js";
// ... import other models ...

const models = {
  User,
  Publication,
  CollaborationRequest,
  // ... other models ...
};

// --- Crucial Association Setup ---
console.log("Setting up model associations..."); // Add log
Object.values(models).forEach((model) => {
  if (model.associate) {
    console.log(` - Calling associate for ${model.name}`); // Add log
    model.associate(models); // Pass the 'models' object
  }
});
console.log("Model associations setup complete."); // Add log
// --- End Crucial Setup ---

const db = {
  ...models,
  sequelize,
};

export default db;
