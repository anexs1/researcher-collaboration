// backend/controllers/messagingController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";

// Ensure models are loaded correctly
const { User, Project, Member } = db;

/**
 * @desc    Get list of contacts the current user can message
 * @route   GET /api/messaging/contacts
 * @access  Private
 */
export const getMessagingContacts = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  console.log(
    `--- ENTERING getMessagingContacts for user ${currentUserId} ---`
  );

  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  try {
    // Verify necessary models are loaded
    if (!Member || !User) {
      console.error(
        "FATAL: Member or User model is undefined in messagingController. Check models/index.js."
      );
      throw new Error(
        "Server configuration error: Required models not available."
      );
    }

    // 1. Find project IDs where the current user is an ACTIVE member
    const userMemberships = await Member.findAll({
      where: { userId: currentUserId, status: "active" },
      attributes: ["projectId"], // Use Model field name
    });

    const projectIdsUserIsIn = userMemberships.map((m) => m.projectId);

    if (projectIdsUserIsIn.length === 0) {
      console.log(
        `User ${currentUserId} is not an active member of any projects.`
      );
      return res.status(200).json({ success: true, data: [] });
    }
    console.log(
      `User ${currentUserId} is active in projects:`,
      projectIdsUserIsIn
    );

    // 2. Find all *other* active members in those same projects
    const coMembers = await Member.findAll({
      where: {
        projectId: { [Op.in]: projectIdsUserIsIn },
        userId: { [Op.ne]: currentUserId },
        status: "active",
      },
      include: [
        {
          model: User,
          as: "user", // Alias from Member.associate
          // *** Select ONLY columns that exist in the Users table/User model ***
          attributes: ["id", "username", "profilePictureUrl"], // Use Model field names
          // REMOVED 'firstName', 'lastName'
        },
      ],
      attributes: ["userId"], // Use Model field name
    });

    // 3. Process results into a unique list of contacts
    const contactsMap = new Map();
    coMembers.forEach((member) => {
      if (member.user?.id && !contactsMap.has(member.user.id)) {
        contactsMap.set(member.user.id, {
          id: member.user.id,
          username: member.user.username,
          // Use username as 'name' since firstName/lastName aren't available
          name: member.user.username || `User ${member.user.id}`,
          profilePictureUrl: member.user.profilePictureUrl,
          // Placeholders
          lastMessageSnippet: null,
          lastMessageTimestamp: null,
          unreadCount: 0,
        });
      }
    });

    const uniqueContacts = Array.from(contactsMap.values());
    uniqueContacts.sort((a, b) => (a.name || "").localeCompare(b.name || "")); // Sort by name (username)

    console.log(
      `Found ${uniqueContacts.length} unique contacts for user ${currentUserId}`
    );
    res.status(200).json({ success: true, data: uniqueContacts });
  } catch (error) {
    console.error(`Error fetching contacts for user ${currentUserId}:`, error);
    if (error.message.includes("associated")) {
      console.error("Hint: Check model associations and 'as' aliases.");
    }
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage =
      error.message || "Server error fetching message contacts.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

// Add other messaging controllers here later
