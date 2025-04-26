// backend/controllers/messagingController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";

// Ensure all necessary models are loaded correctly
const { User, Project, Member, CollaborationRequest } = db;

// Keep getMessagingContacts if needed elsewhere, or remove it

/**
 * @desc    Get contacts grouped by shared projects (members & pending requests)
 * @route   GET /api/messaging/grouped-contacts
 * @access  Private
 */
export const getGroupedContacts = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  console.log(`--- ENTERING getGroupedContacts for user ${currentUserId} ---`);

  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  try {
    // Verify models
    if (!Project || !User || !Member || !CollaborationRequest) {
      console.error(
        "FATAL: Required models not loaded for getGroupedContacts."
      );
      throw new Error("Server configuration error: Models not available.");
    }

    // 1. Find projects owned by the user
    const ownedProjects = await Project.findAll({
      where: { ownerId: currentUserId },
      attributes: ["id", "title"], // Get ID and Title
    });
    const ownedProjectIds = ownedProjects.map((p) => p.id);

    // 2. Find projects the user is an ACTIVE member of (excluding owned ones to avoid duplicates)
    const memberMemberships = await Member.findAll({
      where: {
        userId: currentUserId,
        status: "active",
        projectId: { [Op.notIn]: ownedProjectIds }, // Exclude already owned projects
      },
      attributes: ["projectId"],
    });
    const memberProjectIds = memberMemberships.map((m) => m.projectId);

    // 3. Get details for projects the user is a member of
    let memberProjects = [];
    if (memberProjectIds.length > 0) {
      memberProjects = await Project.findAll({
        where: { id: { [Op.in]: memberProjectIds } },
        attributes: ["id", "title"],
      });
    }

    // 4. Combine all relevant project details
    const allRelevantProjects = [...ownedProjects, ...memberProjects];
    const allRelevantProjectIds = allRelevantProjects.map((p) => p.id);

    if (allRelevantProjectIds.length === 0) {
      console.log(
        `User ${currentUserId} has no relevant projects for messaging.`
      );
      return res.status(200).json({ success: true, data: [] }); // Return empty array
    }

    console.log(
      `User ${currentUserId} involved in projects:`,
      allRelevantProjectIds
    );

    // 5. Fetch members and pending requesters for these projects in parallel
    const [allMembers, allPendingRequests] = await Promise.all([
      // Fetch all ACTIVE members for these projects (excluding the current user)
      Member.findAll({
        where: {
          projectId: { [Op.in]: allRelevantProjectIds },
          userId: { [Op.ne]: currentUserId }, // Exclude self
          status: "active",
        },
        include: [
          {
            model: User,
            as: "user", // Alias from Member model association
            attributes: ["id", "username", "profilePictureUrl"], // Adjust fields as needed
          },
        ],
        attributes: ["projectId", "userId", "role"], // Include projectId to group later
      }),
      // Fetch all PENDING requests for projects the current user OWNS
      CollaborationRequest.findAll({
        where: {
          projectId: { [Op.in]: ownedProjectIds }, // Only fetch requests for projects they OWN
          status: "pending",
        },
        include: [
          {
            model: User,
            as: "requester", // Alias from CollaborationRequest model association
            attributes: ["id", "username", "profilePictureUrl"], // Adjust fields as needed
          },
        ],
        attributes: ["projectId", "requesterId", "id", "createdAt"], // Include projectId to group later
      }),
    ]);

    // 6. Group the results by project
    const groupedContacts = allRelevantProjects.map((project) => {
      // Find members for this specific project
      const projectMembers = allMembers
        .filter((member) => member.projectId === project.id && member.user) // Filter for project and ensure user data exists
        .map((member) => ({
          // Structure member data
          id: member.user.id,
          username: member.user.username,
          profilePictureUrl: member.user.profilePictureUrl,
          role: member.role, // Include role from member table if needed
          type: "member", // Add a type identifier
        }));

      // Find pending requesters for this specific project (only if owned)
      const projectPendingRequesters = ownedProjectIds.includes(project.id) // Check if current user owns this project
        ? allPendingRequests
            .filter(
              (request) => request.projectId === project.id && request.requester
            ) // Filter for project and ensure requester data exists
            .map((request) => ({
              // Structure requester data
              id: request.requester.id,
              username: request.requester.username,
              profilePictureUrl: request.requester.profilePictureUrl,
              requestId: request.id, // Include request ID if needed for actions
              requestedAt: request.createdAt,
              type: "requester", // Add a type identifier
            }))
        : []; // No pending requesters shown for projects not owned

      return {
        projectId: project.id,
        projectName: project.title,
        // Combine members and requesters for display, or keep separate
        contacts: [...projectMembers, ...projectPendingRequesters],
        // OR:
        // members: projectMembers,
        // pendingRequesters: projectPendingRequesters
      };
    });

    // Filter out projects with no contacts listed (optional)
    const finalGroupedData = groupedContacts.filter(
      (group) => group.contacts.length > 0
    );

    console.log(`Returning ${finalGroupedData.length} groups with contacts.`);
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
