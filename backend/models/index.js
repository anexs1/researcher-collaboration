// models/index.js
import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

// Import all model factory functions
import UserModel from "./user.js";
import PublicationModel from "./Publication.js";
import CollaborationRequestModel from "./CollaborationRequest.js";
import ProjectModel from "./ProjectModel.js";
import MemberModel from "./Member.js";

// Initialize Sequelize models
const User = UserModel(sequelize, DataTypes);
const Publication = PublicationModel(sequelize, DataTypes);
const CollaborationRequest = CollaborationRequestModel(sequelize, DataTypes);
const Project = ProjectModel(sequelize, DataTypes);
const Member = MemberModel(sequelize, DataTypes);

const models = {
  User,
  Publication,
  CollaborationRequest,
  Project,
  Member,
};

// --- Association Setup ---
console.log("Setting up model associations...");

// Associations for User, Project, Publication, etc.
User.associate(models);
Project.associate(models);
Publication.associate(models);
Member.associate(models);
CollaborationRequest.associate(models);

console.log("Model associations setup complete.");

// Export models and sequelize instance
const db = {
  ...models,
  sequelize,
};

export default db;
