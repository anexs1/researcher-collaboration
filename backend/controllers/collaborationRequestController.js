// backend/controllers/collaborationRequestController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Ensure this path is correct for your structure

// Import all necessary models
const { CollaborationRequest, Project, User, Member, sequelize } = db;

// --- Controller to send a request ---
export const sendRequest = asyncHandler(async (req, res) => {
  const transaction = await sequelize.transaction(); // Start transaction
  console.log("--- SEND COLLABORATION REQUEST ---");
  console.log("Request Body:", req.body); // Log received body

  try {
    const { projectId, message } = req.body;
    const requesterId = req.user?.id; // From protect middleware

    // --- Basic Input Validation ---
    if (!requesterId) {
      res.status(401); // Unauthorized
      throw new Error("Authentication required.");
    }
    if (!projectId || isNaN(parseInt(projectId))) {
      res.status(400); // Bad Request
      throw new Error("Valid Project ID is required.");
    }

    // --- Check Project Existence ---
    const project = await Project.findByPk(projectId, { transaction });
    if (!project) {
      await transaction.rollback();
      res.status(404); // Not Found
      throw new Error("Project not found.");
    }
    const recipientId = project.ownerId;
    console.log(`Project found (ID: ${projectId}), Owner ID: ${recipientId}`);

    // --- Business Logic Checks ---
    if (requesterId === recipientId) {
      await transaction.rollback();
      res.status(400); // Bad Request
      throw new Error("You cannot request to join your own project.");
    }

    // Check if user is already a member using correct DB column names
    const isAlreadyMember = await Member.findOne({
      where: {
        user_id: requesterId, // <<< FIX: Use database column name user_id
        project_id: projectId, // <<< FIX: Use database column name project_id
      },
      transaction,
    });
    if (isAlreadyMember) {
      await transaction.rollback();
      res.status(400); // Bad Request
      throw new Error("You are already a member of this project.");
    }
    console.log("Checked for existing membership: Not a member.");

    // Check for existing PENDING request
    const existingPendingRequest = await CollaborationRequest.findOne({
      where: {
        projectId: projectId, // Use model attribute name here (Sequelize maps it)
        requesterId: requesterId, // Use model attribute name here
        status: "pending",
      },
      transaction,
    });
    if (existingPendingRequest) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: "You already have a pending request for this project.",
      });
      return; // Exit early
    }
    console.log("Checked for existing pending request: None found.");

    // --- Create the Request ---
    const request = await CollaborationRequest.create(
      {
        projectId: projectId,
        requesterId: requesterId,
        requestMessage: message || null,
        status: "pending",
      },
      { transaction }
    );
    console.log(`CollaborationRequest created with ID: ${request.id}`);

    // --- Commit Transaction ---
    await transaction.commit();
    console.log("Send request transaction committed successfully.");

    // Success Response
    res.status(201).json({
      success: true,
      message: "Collaboration request sent successfully.",
      data: request, // Return the created request
    });
  } catch (error) {
    // --- Error Handling & Rollback ---
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Transaction rolled back due to error in sendRequest.");
    }
    console.error("Error sending collaboration request:", error);

    // Determine status code and message
    let statusCode = res.statusCode >= 400 ? res.statusCode : 500; // Use status set in try block if available
    let message = error.message || "Server error sending request.";

    if (error.name === "SequelizeUniqueConstraintError") {
      statusCode = 400;
      message =
        "A request for this project already exists or you are already a member.";
    } else if (error.name === "SequelizeValidationError") {
      statusCode = 400;
      message = `Validation Error: ${error.errors
        .map((e) => e.message)
        .join(", ")}`;
    }
    // Specific messages from try block take precedence
    else if (error.message === "Project not found.") statusCode = 404;
    else if (error.message === "You cannot request to join your own project.")
      statusCode = 400;
    else if (error.message === "Valid Project ID is required.")
      statusCode = 400;
    else if (error.message === "Authentication required.") statusCode = 401;
    else if (error.message === "You are already a member of this project.")
      statusCode = 400;

    // Send error response if headers not already sent
    if (!res.headersSent) {
      res.status(statusCode);
    }
    res.json({ success: false, message: message });
  }
});

// --- Controller to get requests received by the logged-in user ---
export const getReceivedRequests = asyncHandler(async (req, res) => {
  console.log("--- GET RECEIVED COLLABORATION REQUESTS ---");
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    // Find projects owned by the user
    const projectsOwned = await Project.findAll({
      where: { ownerId: userId },
      attributes: ["id"],
      raw: true,
    });

    if (!projectsOwned || projectsOwned.length === 0) {
      console.log(`User ${userId} owns no projects.`);
      return res.status(200).json({ success: true, data: [] });
    }

    const projectIdsOwned = projectsOwned.map((p) => p.id);
    console.log(`User ${userId} owns project IDs:`, projectIdsOwned);

    // Find PENDING requests for those projects
    const requests = await CollaborationRequest.findAll({
      where: {
        projectId: projectIdsOwned,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "username", "email", "profilePictureUrl"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "title"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(
      `Found ${requests.length} pending received requests for user ${userId}.`
    );
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching received requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching received requests",
    });
  }
});

// --- Controller to get requests SENT by the logged-in user ---
export const getSentRequests = asyncHandler(async (req, res) => {
  console.log("--- GET SENT COLLABORATION REQUESTS ---");
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    const requests = await CollaborationRequest.findAll({
      where: { requesterId: userId },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "title"],
          include: [
            {
              model: User,
              as: "owner",
              attributes: ["id", "username"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`Found ${requests.length} sent requests for user ${userId}.`);
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching sent requests" });
  }
});

// --- Controller to respond (approve/reject) to a request ---
export const respondToRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body; // Expect 'approved' or 'rejected'
  const userId = req.user?.id; // Logged-in user (must be owner)

  console.log(`--- RESPOND TO COLLABORATION REQUEST ${requestId} ---`);
  console.log(`Action: ${status}, Responder ID: ${userId}`);

  // Validate input
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!["approved", "rejected"].includes(status)) {
    res.status(400);
    throw new Error(
      "Invalid status provided. Must be 'approved' or 'rejected'."
    );
  }
  if (!requestId || isNaN(parseInt(requestId))) {
    res.status(400);
    throw new Error("Valid request ID parameter is required.");
  }

  // Use a transaction for atomicity
  const transaction = await sequelize.transaction();
  try {
    // Find the request, include project details needed for logic and verification
    const request = await CollaborationRequest.findByPk(requestId, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "ownerId", "requiredCollaborators", "status"], // Fields needed
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE, // Lock request row during transaction
    });

    if (!request) {
      res.status(404);
      throw new Error("Collaboration request not found.");
    }
    console.log(`Request found. Project Owner ID: ${request.project?.ownerId}`);

    // Verify ownership
    if (!request.project || request.project.ownerId !== userId) {
      await transaction.rollback();
      res.status(403); // Forbidden
      throw new Error("You are not authorized to respond to this request.");
    }

    // Check if already processed
    if (request.status !== "pending") {
      await transaction.rollback();
      res.status(400); // Bad Request
      throw new Error(`This request has already been ${request.status}.`);
    }

    // Update request status and timestamp
    request.status = status;
    if (CollaborationRequest.rawAttributes.respondedAt) {
      request.respondedAt = new Date();
    }
    await request.save({ transaction });
    console.log(`Request ${requestId} status updated to ${status}.`);

    // --- If approved: Add member AND update project ---
    if (status === "approved") {
      const projectId = request.projectId;
      const requesterIdToAdd = request.requesterId;

      console.log(
        `Attempting to add user ${requesterIdToAdd} as member to project ${projectId}.`
      );
      try {
        // Check if already a member using correct DB column names
        const existingMember = await Member.findOne({
          where: {
            user_id: requesterIdToAdd, // Use database column name
            project_id: projectId, // Use database column name
          },
          transaction,
        });

        let memberAddedOrExisted = false;
        if (!existingMember) {
          await Member.create(
            // Use model attribute names (camelCase) for create, Sequelize maps them
            {
              userId: requesterIdToAdd,
              projectId: projectId,
              role: "member",
              status: "active",
            },
            { transaction }
          );
          console.log(
            `User ${requesterIdToAdd} added successfully as member to project ${projectId}.`
          );
          memberAddedOrExisted = true;
        } else {
          console.log(
            `User ${requesterIdToAdd} is already a member of project ${projectId}.`
          );
          memberAddedOrExisted = true; // Still proceed to update project count
        }

        // Update project collaborator count if member was added or already existed
        if (memberAddedOrExisted) {
          console.log(`Updating project ${projectId} collaborator count.`);
          // Fetch project again within transaction, lock for update
          const projectToUpdate = await Project.findByPk(projectId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!projectToUpdate) {
            throw new Error(
              `Consistency error: Project ${projectId} not found during update phase.`
            );
          }

          console.log(
            `Current requiredCollaborators: ${projectToUpdate.requiredCollaborators}`
          );
          if (projectToUpdate.requiredCollaborators > 0) {
            projectToUpdate.requiredCollaborators -= 1; // Decrement

            // If count hits zero, update project status
            if (projectToUpdate.requiredCollaborators === 0) {
              const closedStatus = "Closed"; // <<<--- ADJUST THIS STATUS NAME IF NEEDED
              console.log(
                `Required collaborators reached 0. Setting project status to '${closedStatus}'.`
              );
              projectToUpdate.status = closedStatus;
            }
            await projectToUpdate.save({ transaction }); // Save project changes
            console.log(
              `Project ${projectId} updated. New requiredCollaborators: ${projectToUpdate.requiredCollaborators}, Status: ${projectToUpdate.status}`
            );
          } else {
            console.log(
              `Project ${projectId} already required 0 collaborators or less. Count not changed.`
            );
          }
        }
      } catch (memberOrProjectError) {
        console.error(
          "Error during member addition or project update:",
          memberOrProjectError
        );
        // Throw error to trigger rollback in outer catch block
        throw new Error(
          "Failed to process membership or project update after approval."
        );
      }
    } // --- End of 'if approved' block ---

    // If everything succeeded, commit the transaction
    await transaction.commit();
    console.log("Response transaction committed successfully.");

    // Send success response
    res.status(200).json({
      success: true,
      message: `Request ${status} successfully.`,
      data: {
        // Return basic updated request info
        id: request.id,
        status: request.status,
        projectId: request.projectId,
        requesterId: request.requesterId,
      },
    });
  } catch (error) {
    // --- Error Handling & Rollback ---
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Transaction rolled back due to error in respondToRequest.");
    }
    console.error(`Error responding to request ${requestId}:`, error);

    let statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    let message = error.message || "Server error responding to request.";

    if (!res.headersSent) {
      res.status(statusCode);
    }
    res.json({ success: false, message: message });
  }
});

// --- Controller to cancel a SENT request (by the requester) ---
export const cancelRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user?.id;

  console.log(`--- CANCEL COLLABORATION REQUEST ${requestId} ---`);
  console.log(`Attempt by User ID: ${userId}`);

  // Validate input
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!requestId || isNaN(parseInt(requestId))) {
    res.status(400);
    throw new Error("Valid request ID parameter is required.");
  }

  const transaction = await sequelize.transaction();
  try {
    // Find the request
    const request = await CollaborationRequest.findByPk(requestId, {
      transaction,
      lock: transaction.LOCK.UPDATE, // Lock row for deletion
    });

    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }

    // Verify ownership (requester)
    if (request.requesterId !== userId) {
      await transaction.rollback();
      res.status(403); // Forbidden
      throw new Error("Not authorized to cancel this request");
    }

    // Check if cancellable (pending)
    if (request.status !== "pending") {
      await transaction.rollback();
      res.status(400); // Bad Request
      throw new Error(`Cannot cancel request with status '${request.status}'.`);
    }

    // Delete the request
    await request.destroy({ transaction });
    console.log(
      `Request ${requestId} cancelled successfully by user ${userId}.`
    );

    // Commit transaction
    await transaction.commit();
    console.log("Cancellation transaction committed.");

    // Success response
    res
      .status(200)
      .json({ success: true, message: "Request cancelled successfully" });
  } catch (error) {
    // --- Error Handling & Rollback ---
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Transaction rolled back due to error during cancellation.");
    }
    console.error("Error canceling request:", error);

    let statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    let message = error.message || "Failed to cancel request";

    if (!res.headersSent) {
      res.status(statusCode);
    }
    res.json({ success: false, message: message });
  }
});
