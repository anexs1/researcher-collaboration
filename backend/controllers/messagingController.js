// backend/controllers/messagingController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path if necessary
import { Op } from "sequelize";

// Ensure all necessary models are loaded correctly
// Adjust imports based on actual usage in THIS file
const { User, Project, Member, CollaborationRequest } = db;

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
    // 2. Verify models needed for this specific function are loaded
    if (!Project || !User || !Member || !CollaborationRequest) {
      console.error(
        "FATAL: Required models (Project, User, Member, CollaborationRequest) not loaded for getGroupedContacts. Check models/index.js."
      );
      // Throwing an error ensures the catch block handles it
      throw new Error(
        "Server configuration error: Required models not available."
      );
    }

    // 3. Find projects owned by the user
    const ownedProjects = await Project.findAll({
      where: { ownerId: currentUserId },
      attributes: ["id", "title"], // Select ID and Title
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
        status: "active",
        projectId: {
          [Op.notIn]: ownedProjectIds.length > 0 ? ownedProjectIds : [0],
        }, // Avoid empty IN clause, handle if no owned projects
      },
      attributes: ["projectId"],
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

    // 6. Combine all relevant project details (owned + member of)
    // Use a Map to ensure unique projects if a user could somehow be owner and member
    const allRelevantProjectsMap = new Map();
    ownedProjects.forEach((p) => allRelevantProjectsMap.set(p.id, p));
    memberProjects.forEach((p) => allRelevantProjectsMap.set(p.id, p)); // Overwrites if already present (which is fine)

    const allRelevantProjects = Array.from(allRelevantProjectsMap.values());
    const allRelevantProjectIds = Array.from(allRelevantProjectsMap.keys());

    if (allRelevantProjectIds.length === 0) {
      console.log(
        `User ${currentUserId} has no relevant projects for messaging.`
      );
      return res.status(200).json({ success: true, data: [] }); // Return empty array
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
          projectId: { [Op.in]: allRelevantProjectIds },
          userId: { [Op.ne]: currentUserId }, // Exclude self
          status: "active",
        },
        include: [
          {
            model: User,
            as: "user", // <<< Alias from Member.associate
            attributes: ["id", "username", "profilePictureUrl"], // Select needed user fields
          },
        ],
        attributes: ["projectId", "userId", "role"], // Include projectId to group later
      }),
      // Fetch all PENDING requests for projects the current user OWNS
      ownedProjectIds.length > 0 // Only run query if user owns projects
        ? CollaborationRequest.findAll({
            where: {
              projectId: { [Op.in]: ownedProjectIds },
              status: "pending",
            },
            include: [
              {
                model: User,
                as: "requester", // Alias from CollaborationRequest model association
                attributes: ["id", "username", "profilePictureUrl"],
              },
            ],
            attributes: ["projectId", "requesterId", "id", "createdAt"], // Include projectId to group later
          })
        : Promise.resolve([]), // Return empty array if user owns no projects
    ]);

    // 8. Group the results by project
    const groupedContacts = allRelevantProjects.map((project) => {
      // Find members for this specific project
      const projectMembers = allMembers
        .filter((member) => member.projectId === project.id && member.user)
        .map((member) => ({
          id: member.user.id, // Use the User's ID
          username: member.user.username,
          profilePictureUrl: member.user.profilePictureUrl,
          role: member.role,
          type: "member", // Type identifier
        }));

      // Find pending requesters for this specific project (only if owned)
      const projectPendingRequesters = ownedProjectIds.includes(project.id)
        ? allPendingRequests
            .filter(
              (request) => request.projectId === project.id && request.requester
            )
            .map((request) => ({
              id: request.requester.id, // Use the User's ID
              username: request.requester.username,
              profilePictureUrl: request.requester.profilePictureUrl,
              requestId: request.id, // Original request ID
              requestedAt: request.createdAt,
              type: "requester", // Type identifier
            }))
        : [];

      // Combine members and requesters into a single contacts array for this project
      const combinedContacts = [...projectMembers, ...projectPendingRequesters];

      // Sort contacts within the group (e.g., members first, then requesters, then alphabetically)
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

    // Filter out projects that ended up with no contacts listed
    const finalGroupedData = groupedContacts.filter(
      (group) => group.contacts.length > 0
    );

    console.log(
      `Returning ${finalGroupedData.length} groups with contacts for user ${currentUserId}.`
    );
    res.status(200).json({ success: true, data: finalGroupedData });
  } catch (error) {
    // --- Error Handling ---
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
    // Ensure response isn't sent twice if error occurs after partial success (unlikely here)
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

// Add other messaging controllers (sendMessage, getMessages) here later...
