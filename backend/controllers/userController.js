// backend/controllers/userController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
// Import file upload handlers if you configure them (e.g., multer, cloudinary)

const { User } = db;

// --- Helper: Define Fields Safe for Public/Admin Views ---
// Ensure this list ONLY contains columns that ACTUALLY EXIST in your DB table
// and matches the list used in authController.js
const publicUserFields = [
  "id",
  "username",
  "email",
  "role",
  "status",
  // REMOVE any fields below if they DON'T exist in your actual DB Table
  "bio",
  "profilePictureUrl",
  // "socialLinks", // Uncomment if the JSON/TEXT column exists
  // "interests", // Uncomment if the JSON/TEXT column exists
  "university",
  "department",
  "companyName",
  "jobTitle",
  "medicalSpecialty",
  "hospitalName",
  "createdAt",
  "updatedAt",
];

// --- Public User Routes ---

/**
 * @desc    Get public profile of a user by ID
 * @route   GET /api/users/public/:userId
 * @access  Public
 */
export const getUserPublicProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || isNaN(parseInt(userId))) {
    res.status(400).json({ message: "Valid user ID parameter is required." });
    return;
  }

  const user = await User.findByPk(userId, {
    attributes: publicUserFields, // Select only the public fields
  });

  if (!user) {
    res.status(404).json({ message: "User profile not found" });
    return;
  }

  // Optionally filter further based on status if needed for public view
  // if(user.status !== 'approved') { ... }

  res.status(200).json({ success: true, data: user });
});

// --- Protected User Routes ---

/**
 * @desc    Update own user profile
 * @route   PUT /api/users/profile
 * @access  Private (Requires logged-in user via 'protect' middleware)
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Get ID from authenticated user

  // Find the user first
  const user = await User.findByPk(userId);
  if (!user) {
    // This should technically not happen if protect middleware worked
    res.status(404).json({ message: "User not found" });
    return;
  }

  // --- Handle Profile Picture Upload (Example - Adapt to your setup) ---
  let profilePictureUrl = user.profilePictureUrl; // Keep existing URL by default
  // Check if the profilePictureUrl column exists in the model before proceeding
  if (User.rawAttributes.profilePictureUrl && req.file) {
    console.log("New profile image file detected:", req.file.originalname);
    // --- !!! REPLACE WITH YOUR ACTUAL UPLOAD LOGIC !!! ---
    // Example: Upload req.file to Cloudinary/S3/local storage
    // const uploadResult = await uploadToCloudStorage(req.file.path);
    // profilePictureUrl = uploadResult.secure_url; // Get URL from storage service
    // For simple testing with local storage (using multer configured for destination):
    // Make sure the path is accessible by the frontend/browser
    profilePictureUrl = `/uploads/profiles/${req.file.filename}`; // Example only
    console.log("Updated profilePictureUrl to (example):", profilePictureUrl);
  }
  // --- End Profile Picture Handling ---

  // --- Update User Fields ---
  // Destructure ONLY fields that should be updatable by the user and EXIST in the model
  const {
    username,
    bio,
    interests,
    socialLinks, // Assuming these exist based on model check below
    university,
    department,
    companyName,
    jobTitle,
    medicalSpecialty,
    hospitalName,
    // DO NOT allow updating email, password, role, status from here
  } = req.body;

  const updates = {};

  // Validate and update username if changed and field exists
  if (
    username !== undefined &&
    username.trim() !== user.username &&
    User.rawAttributes.username
  ) {
    const newUsername = username.trim();
    if (newUsername.length < 3) {
      res
        .status(400)
        .json({ message: "Username must be at least 3 characters." });
      return;
    }
    const existingUsername = await User.findOne({
      where: { username: newUsername },
    });
    if (existingUsername && existingUsername.id !== userId) {
      res.status(400).json({ message: "Username is already taken." });
      return;
    }
    updates.username = newUsername;
  }

  // Update other fields ONLY IF they exist in the model
  if (bio !== undefined && User.rawAttributes.bio) updates.bio = bio;
  if (
    profilePictureUrl !== user.profilePictureUrl &&
    User.rawAttributes.profilePictureUrl
  )
    updates.profilePictureUrl = profilePictureUrl;
  if (university !== undefined && User.rawAttributes.university)
    updates.university = university;
  if (department !== undefined && User.rawAttributes.department)
    updates.department = department;
  if (companyName !== undefined && User.rawAttributes.companyName)
    updates.companyName = companyName;
  if (jobTitle !== undefined && User.rawAttributes.jobTitle)
    updates.jobTitle = jobTitle;
  if (medicalSpecialty !== undefined && User.rawAttributes.medicalSpecialty)
    updates.medicalSpecialty = medicalSpecialty;
  if (hospitalName !== undefined && User.rawAttributes.hospitalName)
    updates.hospitalName = hospitalName;

  // Handle JSON fields IF they exist in the model
  if (interests !== undefined && User.rawAttributes.interests) {
    try {
      const parsedInterests = Array.isArray(interests)
        ? interests
        : JSON.parse(interests);
      if (!Array.isArray(parsedInterests))
        throw new Error("Interests must be an array.");
      updates.interests = parsedInterests;
    } catch (e) {
      res.status(400).json({ message: "Invalid format for interests." });
      return;
    }
  }
  if (socialLinks !== undefined && User.rawAttributes.socialLinks) {
    try {
      const parsedLinks =
        typeof socialLinks === "object" && socialLinks !== null
          ? socialLinks
          : JSON.parse(socialLinks);
      if (typeof parsedLinks !== "object" || parsedLinks === null)
        throw new Error("Social links must be an object.");
      // Optional: Validate specific link keys (linkedin, github, etc.)
      updates.socialLinks = parsedLinks;
    } catch (e) {
      res.status(400).json({ message: "Invalid format for social links." });
      return;
    }
  }

  // --- Save Updates ---
  try {
    // Only save if there are actual updates
    if (Object.keys(updates).length > 0) {
      Object.assign(user, updates); // Apply updates to the user instance
      await user.save(); // Save changes to the database
      console.log(`Profile updated for user ID ${userId}`);
    } else {
      console.log(`No profile changes detected for user ID ${userId}`);
    }

    // Fetch the updated user again using public fields for consistency in response
    const updatedUserData = await User.findByPk(userId, {
      attributes: publicUserFields,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUserData, // Return the updated public data
    });
  } catch (error) {
    console.error("Error saving user profile:", error);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      res.status(400).json({ message: "Validation Error", errors: messages });
    } else {
      res.status(500).json({ message: "Server error updating profile." });
    }
  }
});

// --- Admin User Management Routes ---

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const adminGetAllUsers = asyncHandler(async (req, res) => {
  // Add pagination later if needed
  try {
    const users = await User.findAll({
      attributes: publicUserFields, // Use the consistent public fields list
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error("Admin: Error fetching all users:", error);
    res.status(500).json({ message: "Server error fetching users." });
  }
});

/**
 * @desc    Get users pending approval (Admin only)
 * @route   GET /api/admin/users/pending
 * @access  Private/Admin
 */
export const adminGetPendingUsers = asyncHandler(async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: { status: "pending" },
      attributes: publicUserFields, // Use the consistent public fields list
      order: [["createdAt", "ASC"]], // Show oldest pending first
    });
    res
      .status(200)
      .json({ success: true, count: pendingUsers.length, data: pendingUsers });
  } catch (error) {
    console.error("Admin: Error fetching pending users:", error);
    res.status(500).json({ message: "Server error fetching pending users." });
  }
});

/**
 * @desc    Get a single user by ID (Admin only)
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const adminGetUserById = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;

  if (!userId || isNaN(parseInt(userId))) {
    res.status(400).json({ message: "Valid user ID parameter is required." });
    return;
  }

  try {
    const user = await User.findByPk(userId, {
      attributes: publicUserFields, // Use the consistent public fields list
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(`Admin: Error fetching user ID ${userId}:`, error);
    res.status(500).json({ message: "Server error fetching user details." });
  }
});

/**
 * @desc    Update user status (Admin only)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private/Admin
 */
export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id: userId } = req.params;

  const allowedStatuses = ["approved", "rejected", "suspended", "pending"];
  if (!status || !allowedStatuses.includes(status)) {
    res
      .status(400)
      .json({
        message: `Invalid status. Must be one of: ${allowedStatuses.join(
          ", "
        )}`,
      });
    return;
  }

  if (!userId || isNaN(parseInt(userId))) {
    res.status(400).json({ message: "Valid user ID parameter is required." });
    return;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // Prevent admin changing own status via this route
  if (user.id.toString() === req.user.id.toString()) {
    res
      .status(400)
      .json({
        message: "Admins cannot change their own status via this endpoint.",
      });
    return;
  }

  try {
    user.status = status;
    await user.save();

    console.log(
      `Admin ${req.user.email} updated status of user ${user.email} (ID: ${userId}) to ${status}`
    );
    // TODO: Add email notification logic here if desired

    // Return relevant fields of the updated user
    const updatedUserData = await User.findByPk(userId, {
      attributes: publicUserFields,
    });

    res.status(200).json({
      success: true,
      message: `User "${user.username}" status updated to ${status}.`,
      data: updatedUserData,
    });
  } catch (error) {
    console.error(`Admin: Error updating status for user ID ${userId}:`, error);
    res.status(500).json({ message: "Server error updating user status." });
  }
});

/**
 * @desc    Update user role (Admin only)
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/Admin
 */
export const adminUpdateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { id: userId } = req.params;

  // Get allowed roles from the model definition dynamically
  const allowedRoles = User.rawAttributes.role.values;
  if (!role || !allowedRoles || !allowedRoles.includes(role)) {
    res
      .status(400)
      .json({
        message: `Invalid role. Must be one of: ${
          allowedRoles ? allowedRoles.join(", ") : "N/A"
        }`,
      });
    return;
  }

  if (!userId || isNaN(parseInt(userId))) {
    res.status(400).json({ message: "Valid user ID parameter is required." });
    return;
  }

  // Prevent admin changing own role or promoting others to admin easily via this route
  if (user.id.toString() === req.user.id.toString() || role === "admin") {
    res
      .status(400)
      .json({
        message:
          "Cannot change own role or assign admin role via this endpoint.",
      });
    return;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  try {
    user.role = role;
    await user.save();
    console.log(
      `Admin ${req.user.email} updated role of user ${user.email} (ID: ${userId}) to ${role}`
    );

    const updatedUserData = await User.findByPk(userId, {
      attributes: publicUserFields,
    });
    res.status(200).json({
      success: true,
      message: `User "${user.username}" role updated to ${role}.`,
      data: updatedUserData,
    });
  } catch (error) {
    console.error(`Admin: Error updating role for user ID ${userId}:`, error);
    res.status(500).json({ message: "Server error updating user role." });
  }
});

/**
 * @desc    Delete a user (Admin only)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const adminDeleteUser = asyncHandler(async (req, res) => {
  const { id: userIdToDelete } = req.params;

  if (!userIdToDelete || isNaN(parseInt(userIdToDelete))) {
    res.status(400).json({ message: "Valid user ID parameter is required." });
    return;
  }

  // Prevent admin from deleting themselves
  if (req.user.id.toString() === userIdToDelete.toString()) {
    res
      .status(400)
      .json({ message: "Administrators cannot delete their own account." });
    return;
  }

  const user = await User.findByPk(userIdToDelete);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  try {
    const username = user.username;
    await user.destroy(); // Delete the user
    console.log(
      `Admin ${req.user.email} deleted user ${username} (ID: ${userIdToDelete})`
    );
    res
      .status(200)
      .json({
        success: true,
        message: `User '${username}' deleted successfully.`,
      });
    // Or res.status(204).send();
  } catch (error) {
    console.error(`Admin: Error deleting user ID ${userIdToDelete}:`, error);
    res
      .status(500)
      .json({ message: "Server error occurred while deleting user." });
  }
});
