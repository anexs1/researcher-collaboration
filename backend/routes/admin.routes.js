import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { getDashboardStats } from "../controllers/adminController.js";
import {
  adminGetAllUsers,
  adminGetPendingUsers,
  adminGetUserById,
  adminUpdateUserStatus,
  adminUpdateUserRole,
  adminDeleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// Apply protect and adminOnly middleware to all admin routes
router.use(protect, adminOnly);

// Dashboard Route
router.get("/dashboard", getDashboardStats);

// User Management Routes
router.get("/users", adminGetAllUsers);
router.get("/users/pending", adminGetPendingUsers);
router.get("/users/:id", adminGetUserById);
router.patch("/users/:id/status", adminUpdateUserStatus);
router.patch("/users/:id/role", adminUpdateUserRole);
router.delete("/users/:id", adminDeleteUser);

export default router;
