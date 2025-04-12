import db from "../models/index.js";
const { User } = db;
import { Op } from "sequelize";
import asyncHandler from "express-async-handler";

// --- Admin User Management Controllers ---

// GET /api/admin/users
export const adminGetAllUsers = asyncHandler(async (req, res) => {
  try {
    const {
      search,
      role,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 15,
    } = req.query;

    let whereClause = {};
    let orderClause = [];

    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    if (search) {
      const searchPattern = `%${search}%`;
      whereClause[Op.or] = [
        { username: { [Op.like]: searchPattern } },
        { email: { [Op.like]: searchPattern } },
        { firstName: { [Op.like]: searchPattern } },
        { lastName: { [Op.like]: searchPattern } },
      ];
    }

    if (
      [
        "username",
        "email",
        "firstName",
        "lastName",
        "createdAt",
        "role",
        "status",
      ].includes(sortBy)
    ) {
      orderClause.push([sortBy, sortOrder === "asc" ? "ASC" : "DESC"]);
    } else {
      orderClause.push(["createdAt", "DESC"]);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pagination parameters." });
    }
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: limitNum,
      offset: offset,
      attributes: { exclude: ["password"] },
      distinct: true,
    });

    const pagination = {
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    };

    res.status(200).json({ success: true, data: { users: rows, pagination } });
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching users",
      error: error.message,
    });
  }
});

// GET /api/admin/users/:id
export const adminGetUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id, 10))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user by ID for admin:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching user",
      error: error.message,
    });
  }
});

// PUT /api/admin/users/:id/status
export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!id || isNaN(parseInt(id, 10))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }
  const validStatuses = ["approved", "pending", "rejected", "suspended"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    user.status = status;
    await user.save();
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: `User status updated to ${status}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user status by admin:", error);
    res.status(500).json({
      success: false,
      message: "Server Error updating status",
      error: error.message,
    });
  }
});

// PUT /api/admin/users/:id/role
export const adminUpdateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!id || isNaN(parseInt(id, 10))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }
  const validRoles = ["admin", "user"];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (user.id.toString() === req.user.id.toString() && role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Cannot remove own admin role." });
    }
    user.role = role;
    await user.save();
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role by admin:", error);
    res.status(500).json({
      success: false,
      message: "Server Error updating role",
      error: error.message,
    });
  }
});

// DELETE /api/admin/users/:id
export const adminDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id, 10))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (user.id.toString() === req.user.id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot delete own account." });
    }
    const deletedCount = await User.destroy({ where: { id: id } });
    if (deletedCount > 0) {
      res
        .status(200)
        .json({ success: true, message: "User deleted successfully." });
    } else {
      res
        .status(404)
        .json({ success: false, message: "User not found or delete failed." });
    }
  } catch (error) {
    console.error("Error deleting user by admin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
});

/** Update logged-in user profile */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.firstName = req.body.firstName || user.firstName;
  user.lastName = req.body.lastName || user.lastName;
  user.bio = req.body.bio === undefined ? user.bio : req.body.bio;
  user.institution =
    req.body.institution === undefined
      ? user.institution
      : req.body.institution;

  let socialLinksChanged = false;
  const updatedSocialLinks = { ...(user.socialLinks || {}) };
  if (req.body["socialLinks[linkedin]"] !== undefined) {
    updatedSocialLinks.linkedin = req.body["socialLinks[linkedin]"];
    socialLinksChanged = true;
  }
  if (req.body["socialLinks[github]"] !== undefined) {
    updatedSocialLinks.github = req.body["socialLinks[github]"];
    socialLinksChanged = true;
  }
  if (req.body["socialLinks[twitter]"] !== undefined) {
    updatedSocialLinks.twitter = req.body["socialLinks[twitter]"];
    socialLinksChanged = true;
  }
  if (socialLinksChanged) {
    user.socialLinks = updatedSocialLinks;
    user.changed("socialLinks", true);
  }

  let interestsChanged = false;
  const interests = [];
  let i = 0;
  while (req.body[`interests[${i}]`] !== undefined) {
    interests.push(String(req.body[`interests[${i}]`]).trim());
    i++;
    interestsChanged = true;
  }
  if (interestsChanged || req.body["interests[0]"] !== undefined) {
    user.interests = interests.filter(Boolean);
    user.changed("interests", true);
  }

  if (req.file) {
    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
    user.profilePictureUrl = profilePicturePath;
  }

  const updatedUser = await user.save();

  res.status(200).json({
    id: updatedUser.id,
    username: updatedUser.username,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    bio: updatedUser.bio,
    profilePictureUrl: updatedUser.profilePictureUrl,
    socialLinks: updatedUser.socialLinks,
    interests: updatedUser.interests,
    institution: updatedUser.institution,
    role: updatedUser.role,
  });
});

/** Public user profile */
export const getPublicUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.userId, {
    attributes: [
      "id",
      "username",
      "firstName",
      "lastName",
      "bio",
      "profilePictureUrl",
      "institution",
      "socialLinks",
      "interests",
      "createdAt",
    ],
  });

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("User profile not found");
  }
});

/** Searchable users */
export const getSearchableUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  try {
    const whereClause = search
      ? {
          [Op.or]: [
            { username: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { firstName: { [Op.like]: `%${search}%` } },
            { lastName: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching searchable users:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error fetching users" });
  }
});
