// backend/routes/helpCenterApiRoutes.js
import express from "express";
const router = express.Router();

// Import controllers using named exports from controller files
import * as categoryController from "../controllers/categoryController.js";
import * as helpItemController from "../controllers/helpItemController.js";
import * as contactController from "../controllers/contactController.js";
// VVVV --- CORRECTED IMPORT TO USE 'adminOnly' --- VVVV
import { protect, adminOnly } from "../middleware/authMiddleware.js";

// --- Public Help Center Routes ---
// These routes will be prefixed with /api/help-center/ by server.js
router.get("/categories", categoryController.getAllCategories);
router.get("/categories/:slug", categoryController.getCategoryBySlug);

router.get("/items", helpItemController.getAllHelpItems);
router.get("/items/:id", helpItemController.getHelpItemById);

router.post("/contact", contactController.submitContactForm);

// --- ADMIN Routes for Help Center Management ---
const adminRouter = express.Router({ mergeParams: true }); // Create a sub-router

// Contact Submission Management (Admin)
// These routes will be prefixed with /api/help-center/admin/
adminRouter.get(
  "/contact-submissions",
  protect, // First, ensure user is logged in
  adminOnly, // Then, ensure user is an admin
  contactController.getAllSubmissions
);
adminRouter.get(
  "/contact-submissions/:id",
  protect,
  adminOnly,
  contactController.getSubmissionById
);
adminRouter.patch(
  "/contact-submissions/:id/resolve",
  protect,
  adminOnly,
  contactController.toggleResolveSubmission
);

// Example: Admin routes for categories (if you implement CUD operations in categoryController)
// adminRouter.post("/categories", protect, adminOnly, categoryController.createCategory);
// adminRouter.put("/categories/:id", protect, adminOnly, categoryController.updateCategory);
// adminRouter.delete("/categories/:id", protect, adminOnly, categoryController.deleteCategory);

// Example: Admin routes for help items (if you implement CUD operations in helpItemController)
// adminRouter.post("/items", protect, adminOnly, helpItemController.createHelpItem);
// adminRouter.put("/items/:id", protect, adminOnly, helpItemController.updateHelpItem);
// adminRouter.delete("/items/:id", protect, adminOnly, helpItemController.deleteHelpItem);

// Mount the admin sub-router under '/admin' relative to '/api/help-center'
router.use("/admin", adminRouter);

export default router;
