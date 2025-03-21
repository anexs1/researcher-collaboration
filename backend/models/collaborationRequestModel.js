// import { DataTypes } from "sequelize";

// import sequelize from "../config/db";
// // import User
// import User from "./user";
// // Add .js extensionimport User from "./user";
// import Publication from "./publicationModel";

// const CollaborationRequest = sequelize.define("CollaborationRequest", {
//   id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true,
//   },
//   requesterId: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     references: {
//       model: User,
//       key: "id",
//     },
//   },
//   publicationId: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     references: {
//       model: Publication,
//       key: "id",
//     },
// //   }
//   status: {
//     type: DataTypes.ENUM("pending", "approved"),
//     defaultValue: "pending",
//   },
// });
// export default CollaborationRequest;
