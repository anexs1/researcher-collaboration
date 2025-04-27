// backend/controllers/messagingController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path if necessary
import { Op } from "sequelize";

// Ensure all necessary models are loaded correctly
const { User, Project, Member, CollaborationRequest, Message } = db;

/**
 * @desc    Get contacts grouped by shared projects (members & pending requests)
 * @route   GET /api/messaging/grouped-contacts
 * @access  Private
 */
export const getGroupedContacts = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  console.log(`--- ENTERING getGroupedContacts for user ${currentUserId} ---`);

  // 1. Validate Authentication
  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  try {
    // 2. Verify models needed are loaded
    if (!Project || !User || !Member || !CollaborationRequest) {
      console.error(
        "FATAL: Required models not loaded for getGroupedContacts."
      );
      throw new Error(
        "Server configuration error: Required models not available."
      );
    }

    // 3. Find projects owned by the user
    const ownedProjects = await Project.findAll({
      where: { ownerId: currentUserId },
      attributes: ["id", "title"],
    });
    const ownedProjectIds = ownedProjects.map((p) => p.id);
    console.log(
      `User ${currentUserId} owns projects:`,
      ownedProjectIds.length > 0 ? ownedProjectIds : "None"
    );

    // 4. Find projects the user is an ACTIVE member of (excluding owned ones)
    const memberMemberships = await Member.findAll({
      where: {
        userId: currentUserId,
        status: "active", // <<< Use the Member model field name (camelCase)
        projectId: {
          [Op.notIn]: ownedProjectIds.length ? ownedProjectIds : [0],
        },
      },
      attributes: ["projectId"], // <<< Use the Member model field name (camelCase)
    });
    const memberProjectIds = memberMemberships.map((m) => m.projectId);

    // 5. Get details for projects the user is a member of
    let memberProjects = [];
    if (memberProjectIds.length > 0) {
      memberProjects = await Project.findAll({
        where: { id: { [Op.in]: memberProjectIds } },
        attributes: ["id", "title"],
      });
      console.log(
        `User ${currentUserId} is member of projects:`,
        memberProjectIds
      );
    } else {
      console.log(
        `User ${currentUserId} is not an active member of any additional projects.`
      );
    }

    // 6. Combine all relevant project details
    const allRelevantProjectsMap = new Map();
    ownedProjects.forEach((p) => allRelevantProjectsMap.set(p.id, p));
    memberProjects.forEach((p) => allRelevantProjectsMap.set(p.id, p));
    const allRelevantProjects = Array.from(allRelevantProjectsMap.values());
    const allRelevantProjectIds = Array.from(allRelevantProjectsMap.keys());

    if (allRelevantProjectIds.length === 0) {
      console.log(
        `User ${currentUserId} has no relevant projects for messaging.`
      );
      return res.status(200).json({ success: true, data: [] });
    }
    console.log(
      `User ${currentUserId} involved in relevant projects:`,
      allRelevantProjectIds
    );

    // 7. Fetch members and pending requesters for these projects in parallel
    const [allMembers, allPendingRequests] = await Promise.all([
      // Fetch all ACTIVE members for these projects (excluding the current user)
      Member.findAll({
        where: {
          projectId: { [Op.in]: allRelevantProjectIds }, // <<< Use Member model field (camelCase)
          userId: { [Op.ne]: currentUserId }, // <<< Use Member model field (camelCase)
          status: "active", // <<< Use Member model field (camelCase)
        },
        include: [
          {
            model: User,
            as: "user", // Alias from Member.associate
            attributes: ["id", "username", "profilePictureUrl"], // Use User model fields (camelCase)
          },
        ],
        attributes: ["projectId", "userId", "role"], // Use Member model fields (camelCase)
      }),
      // Fetch all PENDING requests for projects the current user OWNS
      ownedProjectIds.length > 0
        ? CollaborationRequest.findAll({
            where: {
              projectId: { [Op.in]: ownedProjectIds }, // <<< Use CollabRequest model field (camelCase)
              status: "pending", // <<< Use CollabRequest model field (camelCase)
            },
            include: [
              {
                model: User,
                as: "requester", // Alias from CollabRequest.associate
                attributes: ["id", "username", "profilePictureUrl"], // Use User model fields (camelCase)
              },
            ],
            attributes: ["projectId", "requesterId", "id", "createdAt"], // Use CollabRequest model fields (camelCase)
          })
        : Promise.resolve([]),
    ]);

    // 8. Group the results by project
    const groupedContacts = allRelevantProjects.map((project) => {
      const projectMembers = allMembers
        .filter((member) => member.projectId === project.id && member.user)
        .map((member) => ({
          id: member.user.id,
          username: member.user.username,
          profilePictureUrl: member.user.profilePictureUrl,
          role: member.role,
          type: "member",
        }));

      const projectPendingRequesters = ownedProjectIds.includes(project.id)
        ? allPendingRequests
            .filter(
              (request) => request.projectId === project.id && request.requester
            )
            .map((request) => ({
              id: request.requester.id,
              username: request.requester.username,
              profilePictureUrl: request.requester.profilePictureUrl,
              requestId: request.id,
              requestedAt: request.createdAt,
              type: "requester",
            }))
        : [];

      const combinedContacts = [...projectMembers, ...projectPendingRequesters];
      combinedContacts.sort((a, b) => {
        if (a.type === "member" && b.type === "requester") return -1;
        if (a.type === "requester" && b.type === "member") return 1;
        return (a.username || "").localeCompare(b.username || "");
      });

      return {
        projectId: project.id,
        projectName: project.title,
        contacts: combinedContacts,
      };
    });

    const finalGroupedData = groupedContacts.filter(
      (group) => group.contacts.length > 0
    );

    console.log(
      `Returning ${finalGroupedData.length} groups with contacts for user ${currentUserId}.`
    );
    res.status(200).json({ success: true, data: finalGroupedData });
  } catch (error) {
    console.error(
      `Error fetching grouped contacts for user ${currentUserId}:`,
      error
    );
    if (error.message.includes("associated")) {
      console.error("Hint: Check model associations and 'as' aliases.");
    }
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage =
      error.message || "Server error fetching grouped contacts.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

/**
 * @desc    Get chat history between current user and another user
 * @route   GET /api/messaging/history/:otherUserId
 * @access  Private
 */
export const getChatHistory = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  const otherUserIdParam = req.params.otherUserId;
  console.log(
    `--- ENTERING getChatHistory between ${currentUserId} and ${otherUserIdParam} ---`
  );

  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  const otherUserId = parseInt(otherUserIdParam);
  if (isNaN(otherUserId) || otherUserId <= 0) {
    res.status(400);
    throw new Error("Invalid user ID.");
  }
  if (currentUserId === otherUserId) {
    res.status(400);
    throw new Error("Cannot fetch chat with yourself.");
  }

  if (!Message) {
    throw new Error("Server config error: Message model not loaded.");
  }

  try {
    const limit = parseInt(req.query.limit) || 50; // Default limit 50 messages
    const offset = parseInt(req.query.offset) || 0; // Default offset 0
    if (isNaN(limit) || limit <= 0 || isNaN(offset) || offset < 0) {
      throw new Error("Invalid limit/offset params.");
    }

    // Use Model field names (camelCase) in where clause
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      order: [["createdAt", "ASC"]], // Fetch oldest first (camelCase model field)
      limit: limit,
      offset: offset,
      // Optionally include sender/receiver details if needed, though usually IDs are sufficient
      // include: [{ model: User, as: 'sender', attributes: [...]}]
    });

    console.log(
      `Found ${messages.length} messages between ${currentUserId} and ${otherUserId}.`
    );
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error(
      `Error fetching chat history between ${currentUserId} and ${otherUserId}:`,
      error
    );
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage =
      error.message || "Server error fetching chat history.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

// Other controllers like sendMessage (likely via sockets) would go here
