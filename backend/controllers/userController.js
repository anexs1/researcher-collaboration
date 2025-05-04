// backend/controllers/userController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Ensure User model is loaded here
import bcrypt from "bcryptjs"; // Needed for password matching/hashing
import { Op } from "sequelize"; // For operators like Op.ne
// --- ADD Required imports for file handling ---
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
// --- END ADD ---

const { User, sequelize /* Add other models if needed directly here */ } = db; // Destructure User model, include sequelize if needed for transactions directly

// --- ES Module __dirname setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assumes controllers/ is a subdirectory of backend/
const BACKEND_ROOT_DIR = path.resolve(__dirname, "..");
// Define specific upload directory for profile pictures inside backend/uploads/
const PROFILE_PIC_UPLOADS_DIR = path.join(
  BACKEND_ROOT_DIR,
  "uploads",
  "profilePictures"
);
// --- End Setup ---

// --- Helper: Define fields to select for different views ---
const publicProfileFields = [
  "id",
  "username",
  "profilePictureUrl",
  "bio",
  "university",
  "department",
  "companyName",
  "jobTitle",
  "medicalSpecialty",
  "hospitalName",
  "socialLinks", // Include social links if they should be public
  "skillsNeeded", // Include skills if they should be public
  "createdAt",
];
const adminUserListFields = [
  "id",
  "username",
  "email",
  "role",
  "status",
  "createdAt",
  "updatedAt",
  "university",
  "department",
  "jobTitle",
];
const adminUserDetailFields = [
  "id",
  "username",
  "email",
  "role",
  "status",
  "university",
  "department",
  "companyName",
  "jobTitle",
  "medicalSpecialty",
  "hospitalName",
  "profilePictureUrl",
  "bio",
  "socialLinks",
  "skillsNeeded",
  "createdAt",
  "updatedAt",
];
const selectableUserFields = ["id", "username", "email"]; // Fields for collaborator dropdown

// --- Helper function to ensure upload directory exists ---
const ensureUploadsDirExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`Directory ${dirPath} not found, creating...`);
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      // Re-throw other errors (like permission errors)
      throw error;
    }
  }
};
// Ensure directory exists on server startup (run once)
// Removed the immediate call here - better to call it within the function that needs it (updateUserProfile)
// ensureUploadsDirExists(PROFILE_PIC_UPLOADS_DIR).catch(err => console.error("Failed to ensure initial profile pic uploads directory:", err));
// --- End Helper ---

// --- Public User Route Controller ---
/**
 * @desc    Get public profile of a user by ID
 * @route   GET /api/users/public/:userId
 * @access  Public
 */
export const getUserPublicProfile = asyncHandler(async (req, res) => {
  console.log("[getUserPublicProfile] req.params:", req.params);
  const userIdParam = req.params.userId; // Correctly access the param name from the route
  console.log(
    `[getUserPublicProfile] Received ID param: ${userIdParam} (type: ${typeof userIdParam})`
  );

  const userId = parseInt(userIdParam, 10);

  if (isNaN(userId) || userId <= 0) {
    console.error(
      `[getUserPublicProfile] Validation FAILED for param: ${userIdParam}, parsed: ${userId}`
    );
    res.status(400);
    throw new Error("Invalid user ID format provided.");
  }

  try {
    console.log(
      `[getUserPublicProfile] Finding user with parsed ID: ${userId}`
    );
    if (!User) throw new Error("User model not loaded correctly.");

    const user = await User.findByPk(userId, {
      attributes: publicProfileFields, // Select only public fields
    });

    if (!user) {
      console.log(`[getUserPublicProfile] User not found for ID: ${userId}`);
      res.status(404); // Not Found
      throw new Error("User not found.");
    }

    console.log(`[getUserPublicProfile] User found: ${user.username}`);
    res.status(200).json({ success: true, data: user }); // Return user data under 'data' key
  } catch (error) {
    console.error(
      `[getUserPublicProfile] Error fetching user ${userId}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error fetching profile.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: message });
    }
  }
});

// --- Protected User 'Me' Route Controllers ---

// ========================================================================
// ========= THIS IS THE CORRECTED updateUserProfile FUNCTION =========
// ========================================================================
/**
 * @desc    Update own user profile (handles text fields and profile picture upload)
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log(`API: updateUserProfile invoked for User ${userId}`);
  console.log("updateUserProfile - Received req.body:", req.body); // Log parsed text fields from FormData
  console.log(
    "updateUserProfile - Received req.file:",
    req.file?.originalname || "No file uploaded"
  );

  if (!User) throw new Error("User model not loaded.");
  if (!sequelize) throw new Error("Sequelize instance not available from db."); // Check sequelize import

  // --- Prepare Update Data Object ---
  const updateData = {};
  // Define fields allowed to be updated directly from req.body text fields
  const allowedFields = [
    "bio",
    "university",
    "department",
    "companyName",
    "jobTitle",
    "medicalSpecialty",
    "hospitalName",
  ];

  // Populate updateData with allowed simple text fields from req.body
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      // Trim strings, allow setting to null/empty if desired
      if (typeof req.body[field] === "string") {
        updateData[field] = req.body[field].trim() || null; // Store empty string as null? Adjust if needed
      } else {
        updateData[field] = req.body[field]; // Assign non-string values directly
      }
    }
  }

  // --- Handle Nested/JSON Fields ---
  // Skills Needed (Assuming frontend sends as JSON string named 'skillsNeeded')
  if (req.body.skillsNeeded !== undefined) {
    try {
      let skills = [];
      // Allow clearing the field by sending empty string or null
      if (req.body.skillsNeeded !== null && req.body.skillsNeeded !== "") {
        skills = JSON.parse(req.body.skillsNeeded);
      }
      if (!Array.isArray(skills)) throw new Error("Skills must be an array.");
      updateData.skillsNeeded = skills; // Add parsed array to updates
      console.log("Parsed skillsNeeded:", skills);
    } catch (e) {
      console.error(
        "Error parsing skillsNeeded JSON:",
        e.message,
        "Input:",
        req.body.skillsNeeded
      );
      res.status(400);
      throw new Error(
        "Invalid format for 'skillsNeeded'. Expected a valid JSON array string (e.g., '[\"React\"]') or empty string/null."
      );
    }
  }

  // Social Links (Assuming frontend sends as JSON string named 'socialLinksJson')
  // *** REMEMBER: Frontend MUST send socialLinks as a JSON string ***
  if (req.body.socialLinksJson !== undefined) {
    try {
      let links = {};
      // Allow clearing the field by sending empty string or null
      if (
        req.body.socialLinksJson !== null &&
        req.body.socialLinksJson !== ""
      ) {
        links = JSON.parse(req.body.socialLinksJson);
      }
      if (typeof links !== "object" || Array.isArray(links))
        throw new Error("Social links must be an object.");
      // Optionally validate specific link keys (linkedin, github etc.) here if needed
      updateData.socialLinks = links; // Add parsed object to updates
      console.log("Parsed socialLinks:", links);
    } catch (e) {
      console.error(
        "Error parsing socialLinks JSON:",
        e.message,
        "Input:",
        req.body.socialLinksJson
      );
      res.status(400);
      throw new Error(
        "Invalid format for 'socialLinksJson'. Expected a valid JSON object string (e.g., '{\"linkedin\":\"url\"}') or empty string/null."
      );
    }
  }
  // --- End Handle Nested/JSON Fields ---

  // --- Handle File Upload ---
  let newImageUrl = null; // DB path e.g., /uploads/profilePictures/image.jpg
  let oldImageUrl = null; // Path of image being replaced (if any)
  let absoluteFilePath = null; // Filesystem path for saving new file

  if (req.file) {
    // Check if multer processed a file
    console.log(
      "Processing uploaded profile picture file:",
      req.file.originalname
    );
    try {
      await ensureUploadsDirExists(PROFILE_PIC_UPLOADS_DIR); // Ensure target dir exists before writing

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      // Sanitize original name
      const safeOriginalName = path
        .basename(req.file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${uniqueSuffix}-${safeOriginalName}`;

      absoluteFilePath = path.join(PROFILE_PIC_UPLOADS_DIR, filename);
      newImageUrl = `/uploads/profilePictures/${filename}`; // <<< URL path saved to DB

      if (!req.file.buffer)
        throw new Error(
          "File buffer is missing from upload (using memory storage)."
        );

      await fs.writeFile(absoluteFilePath, req.file.buffer); // Save the file buffer
      console.log(
        `New profile picture saved to filesystem: ${absoluteFilePath}`
      );

      updateData.profilePictureUrl = newImageUrl; // Add the NEW URL path to the update data
    } catch (uploadError) {
      console.error("Failed to write uploaded profile picture:", uploadError);
      res.status(500); // Internal server error for file system issues
      throw new Error("Server error saving uploaded profile picture.");
    }
  }
  // --- End Handle File Upload ---

  // --- Check if any updates were actually prepared ---
  // This check runs AFTER processing text fields AND attempting file upload
  if (Object.keys(updateData).length === 0) {
    // This means no recognized text fields were changed AND no new file was successfully processed and added to updateData
    console.log("No valid fields found in updateData to apply.");
    res.status(400);
    throw new Error("No valid profile fields provided for update."); // <<< This is the error you were seeing
  }
  // --- End Check ---

  // --- Perform Database Update within a Transaction ---
  const transaction = await sequelize.transaction();
  try {
    // Find user within transaction
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      // Should not happen if protect middleware worked, but check anyway
      await transaction.rollback(); // Rollback before throwing
      res.status(404);
      throw new Error("User not found for update.");
    }

    // Store old image path *before* updating, but only if a new one is being set
    if (updateData.profilePictureUrl) {
      oldImageUrl = user.profilePictureUrl; // Get the current path from DB
    }

    // Apply the collected updates
    console.log(`Applying final updates to user ${userId}:`, updateData);
    await user.update(updateData, { transaction });

    // Commit the transaction if update is successful
    await transaction.commit();
    console.log(
      `User ${userId} profile update transaction committed successfully.`
    );

    // --- Delete Old Profile Picture (AFTER successful commit) ---
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      // Ensure it's a different image
      console.log(`Attempting to delete old profile picture: ${oldImageUrl}`);
      try {
        // Construct the absolute path from the stored URL path
        // Assumes URLs start '/uploads/' and BACKEND_ROOT_DIR/uploads is static root
        const oldAbsoluteFilePath = path.join(
          BACKEND_ROOT_DIR,
          "uploads",
          oldImageUrl.substring("/uploads/".length)
        ); // Be careful with path construction
        await fs.unlink(oldAbsoluteFilePath);
        console.log(
          `Successfully deleted old profile picture: ${oldAbsoluteFilePath}`
        );
      } catch (deleteError) {
        // Log error but don't fail the request if old image deletion fails
        if (deleteError.code !== "ENOENT") {
          // Ignore "file not found"
          console.error(
            `Error deleting old profile picture file (${oldImageUrl}):`,
            deleteError
          );
        } else {
          console.warn(
            `Old profile picture file not found for deletion: ${oldImageUrl}`
          );
        }
      }
    }
    // --- End Delete Old Image ---

    // Fetch updated user data (excluding password) to return to frontend
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser, // Send back updated user data
    });
  } catch (error) {
    // Rollback transaction if any error occurred during the try block
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Update transaction rolled back due to error.");
    }
    // If a *new* file was successfully saved to disk but DB transaction failed, delete the new file
    if (absoluteFilePath) {
      // Check if we saved a new file path
      console.log(
        `Transaction failed, attempting to delete newly saved file: ${absoluteFilePath}`
      );
      try {
        await fs.unlink(absoluteFilePath);
        console.log("Successfully deleted new profile picture after error.");
      } catch (e) {
        console.error(
          "Error deleting new profile picture after transaction error:",
          e
        );
      }
    }

    console.error(
      `Error during profile update database operation for User ${userId}:`,
      error
    );
    // Handle specific Sequelize errors
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({
        success: false,
        message: "Update failed. A unique value constraint was violated.",
      });
    } else if (error.name === "SequelizeValidationError") {
      res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(". "),
      });
    } else {
      // Use status code set before throwing, or default
      const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
      const message = error.message || "Server error updating profile.";
      // Avoid sending headers twice
      if (!res.headersSent) {
        res.status(statusCode).json({ success: false, message });
      }
    }
  }
});
// ========================================================================
// ========= END OF CORRECTED updateUserProfile FUNCTION ==================
// ========================================================================

/**
 * @desc    Update own user email (requires current password verification)
 * @route   PUT /api/users/me/email
 * @access  Private (Requires login via `protect` middleware)
 */
export const updateUserEmail = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { newEmail, currentPassword } = req.body;

  console.log(
    `API: updateUserEmail invoked for User ${userId} with new email: ${newEmail}`
  );
  if (!User) throw new Error("User model not loaded.");

  if (!newEmail || !currentPassword) {
    res.status(400);
    throw new Error("New email and current password are required.");
  }
  if (!/\S+@\S+\.\S+/.test(newEmail)) {
    res.status(400);
    throw new Error("Invalid email format provided.");
  }

  try {
    const user = await User.scope("withPassword").findByPk(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error("Incorrect current password provided.");
    }

    if (user.email === newEmail) {
      return res.status(200).json({
        success: true,
        message: "Email is already set to this address. No update performed.",
        data: { email: user.email },
      });
    }

    const existingUserWithEmail = await User.findOne({
      where: {
        email: newEmail,
        id: { [Op.ne]: userId },
      },
    });
    if (existingUserWithEmail) {
      res.status(400);
      throw new Error("Email address is already in use by another account.");
    }

    await user.update({
      email: newEmail,
    });
    console.log(`User ${userId} email updated successfully to ${newEmail}.`);

    res.status(200).json({
      success: true,
      message: "Email updated successfully.",
      data: { email: newEmail },
    });
  } catch (error) {
    console.error(`Error updating email for User ${userId}:`, error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res
        .status(400)
        .json({ success: false, message: "Email address already in use." });
    } else if (error.name === "SequelizeValidationError") {
      res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(". "),
      });
    } else {
      const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
      if (!res.headersSent) {
        res.status(statusCode).json({
          success: false,
          message: error.message || "Server error updating email.",
        });
      } else {
        console.error(
          "Headers already sent, could not send error response for:",
          error.message
        );
      }
    }
  }
});

/**
 * @desc    Update own user password
 * @route   PUT /api/users/me/password
 * @access  Private (Requires login via `protect` middleware)
 */
export const updateUserPassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  console.log(`API: updateUserPassword invoked for User ${userId}`);
  if (!User) throw new Error("User model not loaded.");

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required.");
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters long.");
  }
  if (currentPassword === newPassword) {
    res.status(400);
    throw new Error("New password cannot be the same as the current password.");
  }

  try {
    const user = await User.scope("withPassword").findByPk(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error("Incorrect current password provided.");
    }

    user.password = newPassword;
    await user.save();
    console.log(`User ${userId} password updated successfully.`);

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(`Error updating password for User ${userId}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error updating password.",
      });
    }
  }
});

/**
 * @desc    Get users suitable for selection (e.g., collaborators dropdown)
 * @route   GET /api/users/selectable
 * @access  Private (Logged-in users via `protect` middleware)
 */
export const getSelectableUsers = asyncHandler(async (req, res) => {
  const requestingUserId = req.user.id;
  console.log(`API: getSelectableUsers invoked by User ${requestingUserId}`);
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  try {
    const users = await User.findAll({
      where: {
        status: "approved",
        id: { [Op.ne]: requestingUserId },
      },
      attributes: selectableUserFields,
      order: [["username", "ASC"]],
    });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(
      `Error fetching selectable users for User ${requestingUserId}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Server error fetching user list.",
    });
  }
});

// --- Admin User Route Controllers ---
/**
 * @desc    Get all users (Admin only) with pagination and filtering
 * @route   GET /api/admin/users (Example route)
 * @access  Private/Admin
 */
export const adminGetAllUsers = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
  console.log(`ADMIN API: adminGetAllUsers invoked by Admin ${req.user.id}`);
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  try {
    const { page = 1, limit = 15, search, role, status } = req.query;
    const where = {};
    if (search) {
      const likeOperator =
        sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
      where[Op.or] = [
        { username: { [likeOperator]: `%${search}%` } },
        { email: { [likeOperator]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    if (
      isNaN(parsedLimit) ||
      parsedLimit <= 0 ||
      isNaN(parsedPage) ||
      parsedPage <= 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pagination params." });
    }
    const offset = (parsedPage - 1) * parsedLimit;
    console.log("Admin Get All Users - Query:", {
      where,
      limit: parsedLimit,
      offset,
    });
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: adminUserListFields,
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });
    console.log(`ADMIN: Found ${count} users, returning page ${parsedPage}.`);
    const responsePayload = {
      success: true,
      data: {
        users,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / parsedLimit),
          currentPage: parsedPage,
          limit: parsedLimit,
        },
      },
    };
    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("ADMIN API Error fetching all users:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching users." });
  }
});

/**
 * @desc    Get pending users (Admin only)
 * @route   GET /api/admin/pending-users (Example route)
 * @access  Private/Admin
 */
export const adminGetPendingUsers = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
  console.log(
    `ADMIN API: adminGetPendingUsers invoked by Admin ${req.user.id}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  try {
    const pendingUsers = await User.findAll({
      where: { status: "pending" },
      attributes: adminUserListFields,
      order: [["createdAt", "ASC"]],
    });
    res
      .status(200)
      .json({ success: true, count: pendingUsers.length, data: pendingUsers });
  } catch (error) {
    console.error("Admin Error fetching pending users:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching pending users.",
    });
  }
});

/**
 * @desc    Get a single user's details by ID (Admin only)
 * @route   GET /api/admin/users/:id (Example route)
 * @access  Private/Admin
 */
export const adminGetUserById = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
  const userIdParam = req.params.id;
  console.log(
    `ADMIN API: adminGetUserById for User ID: ${userIdParam} by Admin ${req.user.id}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  try {
    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId) || userId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID." });
    }
    const user = await User.findByPk(userId, {
      attributes: adminUserDetailFields,
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(`Admin Error fetching user ${userIdParam}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching user details." });
  }
});

/**
 * @desc    Update a user's status (e.g., approve/reject/suspend) (Admin only)
 * @route   PATCH /api/admin/users/:id/status (Example route)
 * @access  Private/Admin
 */
export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
  const userIdParam = req.params.id;
  const { status } = req.body;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: adminUpdateUserStatus for User ${userIdParam} to status '${status}' by Admin ${adminUserId}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  const validStatuses = User.getAttributes().status?.values;
  if (!status || !validStatuses || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status.` });
  }
  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }
  if (userId === adminUserId) {
    return res
      .status(400)
      .json({ success: false, message: "Cannot change own status." });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (user.status === status) {
      return res.status(200).json({
        success: true,
        message: `Status already '${status}'.`,
        data: user,
      });
    }
    user.status = status;
    await user.save();
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: `Status updated to ${status}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error(
      `Admin Error updating status for user ${userIdParam}:`,
      error
    );
    res
      .status(500)
      .json({ success: false, message: "Server error updating status." });
  }
});

/**
 * @desc    Update a user's role (Admin only)
 * @route   PATCH /api/admin/users/:id/role (Example route)
 * @access  Private/Admin
 */
export const adminUpdateUserRole = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
  const userIdParam = req.params.id;
  const { role } = req.body;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: adminUpdateUserRole for User ${userIdParam} to role '${role}' by Admin ${adminUserId}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  const validRoles = User.getAttributes().role?.values;
  if (!role || !validRoles || !validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: `Invalid role.` });
  }
  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }
  if (userId === adminUserId) {
    return res
      .status(400)
      .json({ success: false, message: "Cannot change own role." });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (user.role === role) {
      return res.status(200).json({
        success: true,
        message: `Role already '${role}'.`,
        data: user,
      });
    }
    user.role = role;
    await user.save();
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: `Role updated to ${role}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error(`Admin Error updating role for user ${userIdParam}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error updating role." });
  }
});

/**
 * @desc    Delete a user (Admin only)
 * @route   DELETE /api/admin/users/:id (Example route)
 * @access  Private/Admin
 */
export const adminDeleteUser = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
  const userIdToDeleteParam = req.params.id;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: adminDeleteUser for User ${userIdToDeleteParam} by Admin ${adminUserId}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  const userIdToDelete = parseInt(userIdToDeleteParam, 10);
  if (isNaN(userIdToDelete)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }
  if (userIdToDelete === adminUserId) {
    return res
      .status(400)
      .json({ success: false, message: "Cannot delete own account." });
  }
  try {
    const user = await User.findByPk(userIdToDelete);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    await user.destroy();
    console.log(
      `Admin ${adminUserId} deleted user ${userIdToDelete} (${user.username}).`
    );
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error(`Admin Error deleting user ${userIdToDeleteParam}:`, error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete user. They may have associated records (e.g., projects, posts) that need to be handled first.",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error deleting user." });
  }
});
