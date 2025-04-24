// backend/controllers/userController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
// Note: bcryptjs is used within the User model's instance method

const { User } = db;

// --- Helper: Define Fields Safe for Public/Admin Views ---
const publicUserFields = [
  "id",
  "username",
  "email",
  "role",
  "status",
  // Add other fields based on your User model definition
  "bio",
  "profilePictureUrl",
  "university",
  "department",
  "companyName",
  "jobTitle",
  "medicalSpecialty",
  "hospitalName",
  "interests", // Add if exists in model
  "socialLinks", // Add if exists in model
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

  // Use defaultScope (defined in model) which excludes password
  const user = await User.findByPk(userId, {
    // No need to specify attributes if defaultScope handles it correctly
    // attributes: publicUserFields, // This might override defaultScope, test if needed
  });

  if (!user) {
    res.status(404).json({ message: "User profile not found" });
    return;
  }

  res.status(200).json({ success: true, data: user });
});

// --- Protected User Routes ---

/**
 * @desc    Update own user profile (general data, excluding email/password)
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Get ID from authenticated user (req.user set by 'protect' middleware)

  // Find the user first (using default scope initially is fine)
  const user = await User.findByPk(userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // --- Handle Profile Picture Upload ---
  let profilePictureUrl = user.profilePictureUrl;
  // Check if the profilePictureUrl attribute exists in the model
  // Use ._attributes which lists defined fields, or .rawAttributes for detailed info
  if ("profilePictureUrl" in User.getAttributes() && req.file) {
    // Safer check
    console.log("New profile image file detected:", req.file.originalname);
    // *** Replace with your actual upload logic ***
    profilePictureUrl = `/uploads/profiles/${req.file.filename}`; // Example placeholder
    console.log("Updated profilePictureUrl to (example):", profilePictureUrl);
  }

  // --- Update User Fields ---
  const {
    username,
    bio,
    interests,
    socialLinks,
    university,
    department,
    companyName,
    jobTitle,
    medicalSpecialty,
    hospitalName,
  } = req.body;

  const updates = {};
  const modelAttributes = User.getAttributes(); // Get defined attributes once

  // Validate and update username if changed and field exists
  if (
    username !== undefined &&
    username.trim() !== user.username &&
    modelAttributes.username
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

  // Update other fields ONLY IF they exist in the model definition
  if (bio !== undefined && modelAttributes.bio) updates.bio = bio;
  if (
    profilePictureUrl !== user.profilePictureUrl &&
    modelAttributes.profilePictureUrl
  )
    updates.profilePictureUrl = profilePictureUrl;
  if (university !== undefined && modelAttributes.university)
    updates.university = university;
  if (department !== undefined && modelAttributes.department)
    updates.department = department;
  if (companyName !== undefined && modelAttributes.companyName)
    updates.companyName = companyName;
  if (jobTitle !== undefined && modelAttributes.jobTitle)
    updates.jobTitle = jobTitle;
  if (medicalSpecialty !== undefined && modelAttributes.medicalSpecialty)
    updates.medicalSpecialty = medicalSpecialty;
  if (hospitalName !== undefined && modelAttributes.hospitalName)
    updates.hospitalName = hospitalName;

  // Handle JSON fields IF they exist
  if (interests !== undefined && modelAttributes.interests) {
    try {
      // Assume frontend sends a correctly formatted array or stringified array
      const parsedInterests =
        typeof interests === "string" ? JSON.parse(interests) : interests;
      if (!Array.isArray(parsedInterests))
        throw new Error("Interests must be an array.");
      updates.interests = parsedInterests; // Sequelize handles JSON stringification on save
    } catch (e) {
      res.status(400).json({
        message: "Invalid format for interests. Must be a valid JSON array.",
      });
      return;
    }
  }
  if (socialLinks !== undefined && modelAttributes.socialLinks) {
    try {
      // Assume frontend sends a correctly formatted object or stringified object
      const parsedLinks =
        typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks;
      if (
        typeof parsedLinks !== "object" ||
        parsedLinks === null ||
        Array.isArray(parsedLinks)
      ) {
        throw new Error("Social links must be an object.");
      }
      updates.socialLinks = parsedLinks; // Sequelize handles JSON stringification on save
    } catch (e) {
      res.status(400).json({
        message:
          "Invalid format for social links. Must be a valid JSON object.",
      });
      return;
    }
  }

  // --- Save Updates ---
  try {
    if (Object.keys(updates).length > 0) {
      Object.assign(user, updates);
      await user.save();
      console.log(`Profile updated for user ID ${userId}`);
    } else {
      console.log(`No profile changes detected for user ID ${userId}`);
    }

    // Fetch updated data using default scope (excludes password) for response
    const updatedUserData = await User.findByPk(userId);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUserData,
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

// --- !!! ADDED FUNCTION: Update user's own email !!! ---
/**
 * @desc    Update own user email after verifying password
 * @route   PUT /api/users/me/email
 * @access  Private
 */
export const updateUserEmail = asyncHandler(async (req, res) => {
  const { newEmail, currentPassword } = req.body;
  const userId = req.user.id;

  if (!newEmail || !currentPassword) {
    res
      .status(400)
      .json({ message: "New email and current password are required." });
    return;
  }
  if (!/\S+@\S+\.\S+/.test(newEmail)) {
    res.status(400).json({ message: "Please enter a valid email address." });
    return;
  }

  // Fetch user WITH password using the scope defined in the model
  const user = await User.scope("withPassword").findByPk(userId);

  if (!user) {
    res.status(404).json({ message: "User not found." }); // Should not happen with protect middleware
    return;
  }

  // Prevent updating to the same email
  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    res
      .status(400)
      .json({ message: "New email cannot be the same as the current email." });
    return;
  }

  // Verify Current Password using the instance method from the model
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401).json({ message: "Incorrect current password." });
    return;
  }

  // Check if the new email is already taken by another user
  const emailExists = await User.findOne({ where: { email: newEmail } });
  if (emailExists && emailExists.id !== userId) {
    res.status(400).json({
      message: "This email address is already registered to another account.",
    });
    return;
  }

  // Update and Save
  try {
    user.email = newEmail;
    // Add email verification logic here if needed (set flag, send email)
    await user.save();
    console.log(`Email updated successfully for user ID ${userId}`);

    // Fetch updated data using default scope (excludes password) for response
    const updatedUserData = await User.findByPk(userId);

    res.status(200).json({
      success: true,
      message: "Email updated successfully.",
      data: updatedUserData,
    });
  } catch (error) {
    console.error("Error saving updated email:", error);
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      res.status(400).json({
        message: error.errors
          ? error.errors[0].message
          : "Validation error updating email.",
      });
    } else {
      res.status(500).json({ message: "Server error updating email." });
    }
  }
});

// --- !!! ADDED FUNCTION: Update user's own password !!! ---
/**
 * @desc    Update own user password after verifying current password
 * @route   PUT /api/users/me/password
 * @access  Private
 */
export const updateUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    res
      .status(400)
      .json({ message: "Current password and new password are required." });
    return;
  }
  if (newPassword.length < 6) {
    // Consistent with frontend validation
    res
      .status(400)
      .json({ message: "New password must be at least 6 characters long." });
    return;
  }

  // Fetch user WITH password using scope
  const user = await User.scope("withPassword").findByPk(userId);
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  // Verify Current Password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401).json({ message: "Incorrect current password." });
    return;
  }

  // Optional: Prevent setting the exact same password again
  const isSamePassword = await bcrypt.compare(newPassword, user.password); // Compare directly here
  if (isSamePassword) {
    res.status(400).json({
      message: "New password cannot be the same as the current password.",
    });
    return;
  }

  // Update and Save
  try {
    // Simply set the new password. The beforeSave hook in the model will hash it.
    user.password = newPassword;
    await user.save();

    console.log(`Password updated successfully for user ID ${userId}`);

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Error saving updated password:", error);
    if (error.name === "SequelizeValidationError") {
      res.status(400).json({
        message: error.errors
          ? error.errors[0].message
          : "Validation error updating password.",
      });
    } else {
      res.status(500).json({ message: "Server error updating password." });
    }
  }
});

// --- Admin User Management Routes ---
// (Keep your existing admin functions: adminGetAllUsers, adminGetPendingUsers, etc.)
// Make sure these are exported if they are used in adminRoutes.js
export const adminGetAllUsers = asyncHandler(async (req, res) => {
  // ... implementation ...
});
export const adminGetPendingUsers = asyncHandler(async (req, res) => {
  // ... implementation ...
});
export const adminGetUserById = asyncHandler(async (req, res) => {
  // ... implementation ...
});
export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  // ... implementation ...
});
export const adminUpdateUserRole = asyncHandler(async (req, res) => {
  // ... implementation ...
});
export const adminDeleteUser = asyncHandler(async (req, res) => {
  // ... implementation ...
});
