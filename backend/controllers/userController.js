import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const { User, ActivityLog, Project, sequelize } = db; // Added Project

if (!User || !sequelize) {
  console.error(
    "FATAL: User model or Sequelize instance not loaded in userController.js"
  );
}
if (!Project) {
  console.warn(
    "WARN: Project model not loaded in userController.js. Project counts may not work as expected."
  );
}
if (!ActivityLog) {
  console.warn(
    "WARN: ActivityLog model not loaded in userController.js. User activity features might be affected."
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT_DIR = path.resolve(__dirname, "..");
const PROFILE_PIC_UPLOADS_DIR = path.join(
  BACKEND_ROOT_DIR,
  "uploads",
  "profilePictures"
);

export const publicProfileFields = [
  "id",
  "username",
  /* "email", */ "profilePictureUrl",
  "bio",
  "university",
  "department",
  "companyName",
  "jobTitle",
  "medicalSpecialty",
  "hospitalName",
  "role",
  "createdAt",
  "updatedAt",
  // "skillsNeeded", // Add if column exists and mapped
  // "socialLinks",  // Add if column exists and mapped
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
  "createdAt",
  "updatedAt",
];
const selectableUserFields = ["id", "username", "email", "profilePictureUrl"];

const ensureUploadsDirExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
};

export const getDiscoverableUsers = asyncHandler(async (req, res) => {
  console.log("API: getDiscoverableUsers invoked, Query:", req.query);
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  const { page = 1, limit = 12, search, role, university } = req.query;
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);

  if (
    isNaN(parsedPage) ||
    parsedPage <= 0 ||
    isNaN(parsedLimit) ||
    parsedLimit <= 0
  ) {
    res.status(400);
    throw new Error("Invalid pagination parameters.");
  }
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClause = {
    status: "approved",
    role: { [Op.ne]: "admin" }, // <<< ALWAYS EXCLUDE ADMINS FROM THIS PUBLIC DISCOVERY
  };

  if (search) {
    const likeOp = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
    whereClause[Op.or] = [
      { username: { [likeOp]: `%${search}%` } },
      { university: { [likeOp]: `%${search}%` } },
      { department: { [likeOp]: `%${search}%` } },
      { jobTitle: { [likeOp]: `%${search}%` } },
      { medicalSpecialty: { [likeOp]: `%${search}%` } },
      { companyName: { [likeOp]: `%${search}%` } },
    ];
  }

  // If a role filter is applied from frontend, and it's not 'admin', use it.
  // The base Op.ne: 'admin' still implicitly applies because an 'admin' role won't match.
  if (role && role.toLowerCase() !== "admin") {
    whereClause.role = role; // This overrides the Op.ne if a specific non-admin role is requested
  }

  if (university) {
    const likeOp = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
    whereClause.university = { [likeOp]: `%${university}%` };
  }

  try {
    let attributesToSelect = [...publicProfileFields];
    if (Project && sequelize) {
      attributesToSelect.push(
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM \`Projects\` AS \`p\` WHERE \`p\`.\`ownerId\` = \`User\`.\`id\`)`
          ),
          "totalProjects",
        ],
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM \`Projects\` AS \`p\` WHERE \`p\`.\`ownerId\` = \`User\`.\`id\` AND \`p\`.\`status\` = 'Active')`
          ),
          "activeProjects",
        ],
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM \`Projects\` AS \`p\` WHERE \`p\`.\`ownerId\` = \`User\`.\`id\` AND \`p\`.\`status\` = 'Completed')`
          ),
          "completedProjects",
        ]
      );
    } else {
      console.warn(
        "Project counts omitted due to missing Project model or Sequelize."
      );
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: attributesToSelect,
      order: [["username", "ASC"]],
      limit: parsedLimit,
      offset: offset,
      distinct: true,
    });

    const processedUsers = users.map((user) => {
      const plainUser = user.get({ plain: true });
      return {
        ...plainUser,
        totalProjects:
          Project && sequelize ? parseInt(plainUser.totalProjects, 10) || 0 : 0,
        activeProjects:
          Project && sequelize
            ? parseInt(plainUser.activeProjects, 10) || 0
            : 0,
        completedProjects:
          Project && sequelize
            ? parseInt(plainUser.completedProjects, 10) || 0
            : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: processedUsers,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    console.error("Error fetching discoverable users:", error);
    if (error.name?.startsWith("Sequelize"))
      console.error("Sequelize Error:", JSON.stringify(error, null, 2));
    res
      .status(500)
      .json({ success: false, message: "Server error fetching user list." });
  }
});

export const getUserPublicProfile = asyncHandler(async (req, res) => {
  const userIdParam = req.params.userId;
  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId) || userId <= 0) {
    res.status(400);
    throw new Error("Invalid user ID.");
  }
  if (!User) throw new Error("User model not loaded.");

  let attributesToSelect = [...publicProfileFields];
  if (Project && sequelize) {
    attributesToSelect.push(
      [
        sequelize.literal(
          `(SELECT COUNT(*) FROM \`Projects\` AS \`p\` WHERE \`p\`.\`ownerId\` = \`User\`.\`id\`)`
        ),
        "totalProjects",
      ],
      [
        sequelize.literal(
          `(SELECT COUNT(*) FROM \`Projects\` AS \`p\` WHERE \`p\`.\`ownerId\` = \`User\`.\`id\` AND \`p\`.\`status\` = 'Active')`
        ),
        "activeProjects",
      ],
      [
        sequelize.literal(
          `(SELECT COUNT(*) FROM \`Projects\` AS \`p\` WHERE \`p\`.\`ownerId\` = \`User\`.\`id\` AND \`p\`.\`status\` = 'Completed')`
        ),
        "completedProjects",
      ]
    );
  }

  const user = await User.findByPk(userId, { attributes: attributesToSelect });
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const plainUser = user.get({ plain: true });
  const userWithCounts = {
    ...plainUser,
    totalProjects:
      Project && sequelize ? parseInt(plainUser.totalProjects, 10) || 0 : 0,
    activeProjects:
      Project && sequelize ? parseInt(plainUser.activeProjects, 10) || 0 : 0,
    completedProjects:
      Project && sequelize ? parseInt(plainUser.completedProjects, 10) || 0 : 0,
  };
  res.status(200).json({ success: true, data: userWithCounts });
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!User || !sequelize)
    throw new Error("User model or Sequelize not available.");
  const updateData = {};
  const allowedFields = [
    "bio",
    "university",
    "department",
    "companyName",
    "jobTitle",
    "medicalSpecialty",
    "hospitalName",
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined)
      updateData[field] =
        (typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field]) || null;
  });

  // Conditional handling for skillsNeeded and socialLinks (if they exist in your User model)
  if (
    req.body.skillsNeeded !== undefined &&
    User.getAttributes().skillsNeeded
  ) {
    try {
      updateData.skillsNeeded =
        req.body.skillsNeeded && req.body.skillsNeeded.trim() !== ""
          ? JSON.parse(req.body.skillsNeeded)
          : [];
      if (!Array.isArray(updateData.skillsNeeded)) throw new Error();
    } catch (e) {
      res.status(400);
      throw new Error("Invalid 'skillsNeeded' format.");
    }
  }
  if (
    req.body.socialLinksJson !== undefined &&
    User.getAttributes().socialLinks
  ) {
    try {
      updateData.socialLinks =
        req.body.socialLinksJson && req.body.socialLinksJson.trim() !== ""
          ? JSON.parse(req.body.socialLinksJson)
          : {};
      if (
        typeof updateData.socialLinks !== "object" ||
        Array.isArray(updateData.socialLinks)
      )
        throw new Error();
    } catch (e) {
      res.status(400);
      throw new Error("Invalid 'socialLinksJson' format.");
    }
  }

  let newImageUrl = null,
    oldImageUrl = null,
    tempFilePathForRollback = null;
  if (req.file) {
    try {
      await ensureUploadsDirExists(PROFILE_PIC_UPLOADS_DIR);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${path
        .basename(req.file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      tempFilePathForRollback = path.join(PROFILE_PIC_UPLOADS_DIR, filename);
      newImageUrl = `/uploads/profilePictures/${filename}`;
      if (!req.file.buffer) throw new Error("File buffer missing.");
      await fs.writeFile(tempFilePathForRollback, req.file.buffer);
      updateData.profilePictureUrl = newImageUrl;
    } catch (uploadError) {
      res.status(500);
      throw new Error("Server error saving profile picture.");
    }
  }
  if (Object.keys(updateData).length === 0 && !req.file) {
    res.status(400);
    throw new Error("No fields to update.");
  }

  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      res.status(404);
      throw new Error("User not found.");
    }
    if (updateData.profilePictureUrl) oldImageUrl = user.profilePictureUrl;
    await user.update(updateData, { transaction });
    await transaction.commit();
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      try {
        await fs.unlink(path.join(BACKEND_ROOT_DIR, oldImageUrl.substring(1)));
      } catch (e) {
        if (e.code !== "ENOENT")
          console.error("Error deleting old profile pic:", e);
      }
    }
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    res
      .status(200)
      .json({ success: true, message: "Profile updated.", data: updatedUser });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    if (tempFilePathForRollback) {
      try {
        await fs.unlink(tempFilePathForRollback);
      } catch (e) {
        console.error("Error deleting temp profile pic:", e);
      }
    }
    // ... (your specific error handling for constraints/validation)
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    if (!res.headersSent)
      res
        .status(statusCode)
        .json({
          success: false,
          message: error.message || "Server error updating profile.",
        });
  }
});

export const updateUserEmail = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { newEmail, currentPassword } = req.body;
  if (!User) throw new Error("User model not loaded.");
  if (!newEmail || !currentPassword) {
    res.status(400);
    throw new Error("New email and current password are required.");
  }
  if (!/\S+@\S+\.\S+/.test(newEmail)) {
    res.status(400);
    throw new Error("Invalid email format.");
  }
  try {
    const user = await User.scope("withPassword").findByPk(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }
    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error("Incorrect password.");
    }
    if (user.email === newEmail)
      return res
        .status(200)
        .json({
          success: true,
          message: "Email is already this address.",
          data: { email: user.email },
        });
    if (
      await User.findOne({
        where: { email: newEmail, id: { [Op.ne]: userId } },
      })
    ) {
      res.status(400);
      throw new Error("Email already in use.");
    }
    await user.update({ email: newEmail });
    res
      .status(200)
      .json({
        success: true,
        message: "Email updated.",
        data: { email: newEmail },
      });
  } catch (error) {
    const sc = res.statusCode >= 400 ? res.statusCode : 500;
    if (!res.headersSent)
      res
        .status(sc)
        .json({ success: false, message: error.message || "Server error." });
  }
});

export const updateUserPassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  if (!User) throw new Error("User model not loaded.");
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Passwords required.");
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password too short.");
  }
  if (currentPassword === newPassword) {
    res.status(400);
    throw new Error("New password same as old.");
  }
  try {
    const user = await User.scope("withPassword").findByPk(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }
    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error("Incorrect password.");
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: "Password updated." });
  } catch (error) {
    const sc = res.statusCode >= 400 ? res.statusCode : 500;
    if (!res.headersSent)
      res
        .status(sc)
        .json({ success: false, message: error.message || "Server error." });
  }
});

export const getSelectableUsers = asyncHandler(async (req, res) => {
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  try {
    const users = await User.findAll({
      where: { status: "approved", id: { [Op.ne]: req.user.id } },
      attributes: selectableUserFields,
      order: [["username", "ASC"]],
    });
    res.status(200).json({ success: true, data: users });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export const getUserActivity = asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.userId, 10);
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;
  if (isNaN(targetUserId) || targetUserId <= 0) {
    res.status(400);
    throw new Error("Invalid user ID.");
  }
  if (targetUserId !== requestingUserId && requestingUserRole !== "admin") {
    res.status(403);
    throw new Error("Forbidden.");
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const offset = (page - 1) * limit;
  if (page <= 0 || limit <= 0) {
    res.status(400);
    throw new Error("Invalid pagination.");
  }
  if (!ActivityLog) {
    return res
      .status(500)
      .json({
        items: [],
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        message: "ActivityLog N/A",
      });
  } // Mock or error
  try {
    const { count, rows } = await ActivityLog.findAndCountAll({
      where: { userId: targetUserId },
      limit,
      offset,
      order: [["timestamp", "DESC"]],
    });
    res
      .status(200)
      .json({
        items: rows,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
      });
  } catch (e) {
    res.status(500);
    throw new Error("Server error fetching activity.");
  }
});

export const adminGetAllUsers = asyncHandler(async (req, res) => {
  if (!User || !sequelize) {
    return res
      .status(500)
      .json({ success: false, message: "User model/Sequelize N/A." });
  }
  try {
    const { page = 1, limit = 15, search, role, status } = req.query;
    const where = {};
    if (search) {
      const lo = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
      where[Op.or] = [
        { username: { [lo]: `%${search}%` } },
        { email: { [lo]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;
    const pL = parseInt(limit, 10);
    const pP = parseInt(page, 10);
    if (isNaN(pL) || pL <= 0 || isNaN(pP) || pP <= 0) {
      res.status(400);
      throw new Error("Bad pagination.");
    }
    const offset = (pP - 1) * pL;
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: adminUserListFields,
      order: [["createdAt", "DESC"]],
      limit: pL,
      offset,
      distinct: true,
    });
    res
      .status(200)
      .json({
        success: true,
        data: {
          users,
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / pL),
            currentPage: pP,
            limit: pL,
          },
        },
      });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export const adminGetPendingUsers = asyncHandler(async (req, res) => {
  if (!User)
    return res.status(500).json({ success: false, message: "User model N/A." });
  try {
    const u = await User.findAll({
      where: { status: "pending" },
      attributes: adminUserListFields,
      order: [["createdAt", "ASC"]],
    });
    res.status(200).json({ success: true, count: u.length, data: u });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export const adminGetUserById = asyncHandler(async (req, res) => {
  if (!User)
    return res.status(500).json({ success: false, message: "User model N/A." });
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400);
    throw new Error("Invalid ID.");
  }
  try {
    const u = await User.findByPk(id, { attributes: adminUserDetailFields });
    if (!u) {
      res.status(404);
      throw new Error("User not found.");
    }
    res.status(200).json({ success: true, data: u });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  const adminId = req.user.id;
  if (!User)
    return res.status(500).json({ success: false, message: "User model N/A." });
  const vs = User.getAttributes().status?.values;
  if (!status || !vs || !vs.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Use: ${vs.join()}`);
  }
  if (isNaN(id) || id <= 0) {
    res.status(400);
    throw new Error("Invalid ID.");
  }
  if (id === adminId) {
    res.status(400);
    throw new Error("Cannot change own status.");
  }
  try {
    const u = await User.findByPk(id);
    if (!u) {
      res.status(404);
      throw new Error("User not found.");
    }
    if (u.status === status)
      return res
        .status(200)
        .json({ success: true, message: `Status already ${status}.`, data: u });
    u.status = status;
    await u.save();
    const uu = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    res
      .status(200)
      .json({
        success: true,
        message: `Status updated to ${status}.`,
        data: uu,
      });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export const adminUpdateUserRole = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body;
  const adminId = req.user.id;
  if (!User)
    return res.status(500).json({ success: false, message: "User model N/A." });
  const vr = User.getAttributes().role?.values;
  if (!role || !vr || !vr.includes(role)) {
    res.status(400);
    throw new Error(`Invalid role. Use: ${vr.join()}`);
  }
  if (isNaN(id) || id <= 0) {
    res.status(400);
    throw new Error("Invalid ID.");
  }
  if (id === adminId) {
    res.status(400);
    throw new Error("Cannot change own role.");
  }
  try {
    const u = await User.findByPk(id);
    if (!u) {
      res.status(404);
      throw new Error("User not found.");
    }
    if (u.role === role)
      return res
        .status(200)
        .json({ success: true, message: `Role already ${role}.`, data: u });
    u.role = role;
    await u.save();
    const uu = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    res
      .status(200)
      .json({ success: true, message: `Role updated to ${role}.`, data: uu });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export const adminDeleteUser = asyncHandler(async (req, res) => {
  const idDel = parseInt(req.params.id, 10);
  const adminId = req.user.id;
  if (!User)
    return res.status(500).json({ success: false, message: "User model N/A." });
  if (isNaN(idDel) || idDel <= 0) {
    res.status(400);
    throw new Error("Invalid ID.");
  }
  if (idDel === adminId) {
    res.status(400);
    throw new Error("Cannot delete self.");
  }
  try {
    const u = await User.findByPk(idDel);
    if (!u) {
      res.status(404);
      throw new Error("User not found.");
    }
    await u.destroy();
    res.status(200).json({ success: true, message: "User deleted." });
  } catch (e) {
    if (e.name === "SequelizeForeignKeyConstraintError")
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot delete user. Related records exist.",
        });
    res.status(500).json({ success: false, message: "Server error." });
  }
});
