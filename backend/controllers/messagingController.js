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
    // Verify Member model is available
    if (!Member || !User || !Project) {
      console.error(
        "FATAL: User, Project, or Member model is undefined in messagingController. Check models/index.js."
      );
      throw new Error(
        "Server configuration error: Required models not available."
      );
    }

    // 1. Find all project IDs where the current user is an ACTIVE member
    const userMemberships = await Member.findAll({
      where: {
        userId: currentUserId,
        status: "active",
      },
      attributes: ["projectId"],
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
        projectId: { [Op.in]: projectIdsUserIsIn }, // In the same projects
        userId: { [Op.ne]: currentUserId }, // Not the current user
        status: "active", // Only active co-members
      },
      include: [
        {
          model: User,
          as: "user", // <<< Alias from Member.associate
          attributes: [
            "id",
            "username",
            "profilePictureUrl",
            "firstName",
            "lastName",
          ],
        },
      ],
      // We don't need Member fields, just the included user
      attributes: ["userId"], // Include userId to help with potential grouping/mapping if needed
    });

    // 3. Process the results to get a unique list of users
    const contactsMap = new Map();
    coMembers.forEach((member) => {
      // Ensure member.user and member.user.id exist before adding
      if (member.user?.id && !contactsMap.has(member.user.id)) {
        contactsMap.set(member.user.id, {
          id: member.user.id,
          username: member.user.username,
          name:
            [member.user.firstName, member.user.lastName]
              .filter(Boolean)
              .join(" ") || member.user.username, // Construct name, fallback to username
          profilePictureUrl: member.user.profilePictureUrl,
          // Placeholders for future chat features
          lastMessageSnippet: null,
          lastMessageTimestamp: null,
          unreadCount: 0,
        });
      }
    });

    const uniqueContacts = Array.from(contactsMap.values());

    // Sort contacts alphabetically by name or username
    uniqueContacts.sort((a, b) =>
      (a.name || a.username).localeCompare(b.name || b.username)
    );

    console.log(
      `Found ${uniqueContacts.length} unique contacts for user ${currentUserId}`
    );
    res.status(200).json({ success: true, data: uniqueContacts });
  } catch (error) {
    console.error(`Error fetching contacts for user ${currentUserId}:`, error);
    if (error.message.includes("associated")) {
      console.error(
        "Potential Association Error: Check 'as' aliases in Member/User models and includes."
      );
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
