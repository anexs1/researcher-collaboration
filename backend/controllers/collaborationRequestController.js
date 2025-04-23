// backend/controllers/collaborationRequestController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
// Make sure all models used are imported correctly via db
const { CollaborationRequest, Project, User, sequelize } = db; // Added sequelize for transaction
// backend/controllers/collaborationRequestController.js
export const sendRequest = asyncHandler(async (req, res) => {
  const transaction = await sequelize.transaction(); // Start transaction
  console.log("--- SEND COLLABORATION REQUEST ---");
  console.log("Request Body:", req.body); // Log received body

  try {
    const { projectId, message } = req.body;
    const requesterId = req.user?.id; // From protect middleware

    // Potential Failure 1: Auth/User missing
    if (!requesterId) throw new Error("Authentication required.");
    // Potential Failure 2: projectId missing/invalid
    if (!projectId || isNaN(parseInt(projectId)))
      throw new Error("Valid Project ID is required.");

    // Potential Failure 3: Project.findByPk fails (DB error)
    const project = await Project.findByPk(projectId, { transaction });
    if (!project) {
      await transaction.rollback();
      res.status(404);
      throw new Error("Project not found.");
    }
    const recipientId = project.ownerId; // Owner ID
    console.log(
      `Project found (ID: ${projectId}), Owner ID (Recipient): ${recipientId}`
    );

    // Potential Failure 4: Logic error (requesting own project)
    if (requesterId === recipientId) {
      await transaction.rollback();
      res.status(400);
      throw new Error("You cannot request to join your own project.");
    }

    // Potential Failure 5: Member check fails (DB error, if implemented)
    // const existingMember = await Member.findOne(...)
    console.log("Checked for existing membership (placeholder).");

    // Potential Failure 6: CollaborationRequest.findOne fails (DB error)
    const existingRequest = await CollaborationRequest.findOne({
      where: {
        projectId: projectId,
        requesterId: requesterId,
        status: "pending",
      },
      transaction,
    });
    if (existingRequest) {
      await transaction.rollback();
      res.status(400);
      /* Message */ return;
    }
    console.log("Checked for existing pending request.");

    // Potential Failure 7: CollaborationRequest.create fails (DB error, validation, constraint)
    // This is where the 'recipientId' error likely happened before if model was wrong
    const request = await CollaborationRequest.create(
      {
        projectId: projectId,
        requesterId: requesterId,
        requestMessage: message || null, // Use correct field name
        status: "pending",
      },
      { transaction }
    );
    console.log(`CollaborationRequest created with ID: ${request.id}`);

    // Potential Failure 8: Transaction commit fails (DB error)
    await transaction.commit();
    console.log("Transaction committed.");

    // Success
    res.status(201).json({
      /* ... */
    });
  } catch (error) {
    // Catch ANY error from the try block
    await transaction.rollback(); // Rollback on ANY error
    console.error("Error sending collaboration request:", error); // Log the actual error

    // Determine status code and message based on error type
    let statusCode = 500; // Default to 500
    let message = "Server error sending request.";

    if (error.name === "SequelizeUniqueConstraintError") {
      statusCode = 400;
      message = "A request for this project already exists.";
    } else if (error.name === "SequelizeValidationError") {
      statusCode = 400;
      message = `Validation Error: ${error.errors
        .map((e) => e.message)
        .join(", ")}`;
    } else if (error.message === "Project not found.") {
      statusCode = 404;
      message = error.message;
    } else if (
      error.message === "You cannot request to join your own project."
    ) {
      statusCode = 400;
      message = error.message;
    } else if (error.message === "Valid Project ID is required.") {
      statusCode = 400;
      message = error.message;
    } else if (error.message === "Authentication required.") {
      statusCode = 401;
      message = error.message;
    }
    // Add more specific error checks if needed

    res.status(statusCode).json({ success: false, message: message });
  }
});

// --- Controller to get requests received by the logged-in user ---
export const getReceivedRequests = asyncHandler(async (req, res) => {
  console.log("--- GET RECEIVED COLLABORATION REQUESTS ---");
  try {
    const userId = req.user.id; // Logged-in user (potential project owner)

    // Find all projects owned by this user
    const projectsOwned = await Project.findAll({
      where: { ownerId: userId },
      attributes: ["id"], // Only need project IDs
    });

    if (!projectsOwned || projectsOwned.length === 0) {
      console.log(
        `User ${userId} owns no projects. No received requests possible.`
      );
      return res.status(200).json({ success: true, data: [] }); // Return empty array
    }

    const projectIdsOwned = projectsOwned.map((p) => p.id);
    console.log(`User ${userId} owns project IDs:`, projectIdsOwned);

    // Find pending requests where the project ID is one owned by the user
    const requests = await CollaborationRequest.findAll({
      where: {
        projectId: projectIdsOwned, // Request must be for a project owned by the user
        status: "pending", // Only show pending requests
      },
      include: [
        // Include details about the requester and the project
        {
          model: User,
          as: "requester", // Alias defined in CollaborationRequest model
          attributes: ["id", "username", "email", "profilePictureUrl"], // Select relevant fields
        },
        {
          model: Project,
          as: "project", // Alias defined in CollaborationRequest model
          attributes: ["id", "title"], // Select relevant fields
        },
      ],
      order: [["createdAt", "DESC"]], // Show newest requests first
    });

    console.log(
      `Found ${requests.length} pending received requests for user ${userId}.`
    );
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching received requests:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch received requests" });
  }
});

// --- Controller to get requests SENT by the logged-in user ---
export const getSentRequests = asyncHandler(async (req, res) => {
  console.log("--- GET SENT COLLABORATION REQUESTS ---");
  try {
    const userId = req.user.id; // Logged-in user (requester)

    const requests = await CollaborationRequest.findAll({
      where: { requesterId: userId }, // Find requests where the logged-in user is the requester
      include: [
        {
          model: Project,
          as: "project", // Alias for the associated project
          attributes: ["id", "title"], // Get project title
          include: [
            // Nested include to get the project owner's info
            {
              model: User,
              as: "owner", // Alias for the project's owner
              attributes: ["id", "username"], // Get owner's username
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]], // Show newest requests first
    });

    console.log(`Found ${requests.length} sent requests for user ${userId}.`);
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch sent requests" });
  }
});

// --- Controller to respond (approve/reject) to a request ---
export const respondToRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params; // Get request ID from URL: /api/collaboration-requests/:requestId/respond
  const { status, responseMessage } = req.body; // Expect 'approved' or 'rejected', and optional message
  const userId = req.user.id; // Logged-in user must be the project owner

  console.log(`--- RESPOND TO COLLABORATION REQUEST ${requestId} ---`);
  console.log(`Action: ${status}, Responder ID: ${userId}`);

  // Validate input status
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

  // Use a transaction for atomicity (update request + potentially add member)
  const transaction = await sequelize.transaction();
  try {
    // Find the request, including the associated project to check ownership
    const request = await CollaborationRequest.findByPk(requestId, {
      include: [{ model: Project, as: "project", attributes: ["ownerId"] }], // Need ownerId
      transaction,
    });

    if (!request) {
      await transaction.rollback();
      res.status(404);
      throw new Error("Collaboration request not found.");
    }
    console.log(`Request found. Project Owner ID: ${request.project?.ownerId}`);

    // Verify the logged-in user owns the project associated with the request
    if (!request.project || request.project.ownerId !== userId) {
      await transaction.rollback();
      res.status(403);
      throw new Error("You are not authorized to respond to this request.");
    }

    // Check if the request is still pending
    if (request.status !== "pending") {
      await transaction.rollback();
      res.status(400);
      throw new Error(`This request has already been ${request.status}.`);
    }

    // Update the request status and optional response message
    request.status = status;
    // Only update these if the columns exist in your DB/Model:
    if (responseMessage && CollaborationRequest.rawAttributes.responseMessage) {
      request.responseMessage = responseMessage;
    }
    if (CollaborationRequest.rawAttributes.respondedAt) {
      request.respondedAt = new Date();
    }
    await request.save({ transaction });
    console.log(`Request ${requestId} status updated to ${status}.`);

    // If approved, add the user as a project member
    // !!! IMPORTANT: Requires a 'Member' model and appropriate associations !!!
    if (status === "approved") {
      console.log(
        `Attempting to add user ${request.requesterId} as member to project ${request.projectId}.`
      );
      try {
        // Check if member already exists (belt-and-suspenders)
        const existingMember = await Member.findOne({
          where: { userId: request.requesterId, projectId: request.projectId },
          transaction,
        });
        if (!existingMember) {
          await Member.create(
            {
              userId: request.requesterId,
              projectId: request.projectId,
              role: "member", // Or another default/configurable role
            },
            { transaction }
          );
          console.log(
            `User ${request.requesterId} added successfully to project ${request.projectId}.`
          );
        } else {
          console.log(
            `User ${request.requesterId} is already a member of project ${request.projectId}.`
          );
        }
      } catch (memberError) {
        console.error("Error adding project member:", memberError);
        // Throw error to trigger transaction rollback
        throw new Error(
          "Failed to add user to project members after approval."
        );
      }
      console.warn(
        "Member creation logic is commented out. Requires Member model."
      );
    }

    // If all steps succeed, commit the transaction
    await transaction.commit();
    console.log("Response transaction committed.");

    // TODO: Notify the requester about the decision

    res.status(200).json({
      success: true,
      message: `Request ${status} successfully.`,
      data: {
        // Return updated request info
        id: request.id,
        status: request.status,
        projectId: request.projectId,
        requesterId: request.requesterId,
      },
    });
  } catch (error) {
    // Rollback transaction if any error occurred
    await transaction.rollback();
    console.error(`Error responding to request ${requestId}:`, error);
    if (!res.headersSent) {
      // Avoid setting status if already set
      res.status(error.status || 500); // Use error status if available (like 400, 403, 404)
    }
    // Send error response
    res.json({
      success: false,
      message: error.message || "Server error responding to request.",
    });
  }
});

// --- Controller to cancel a SENT request (by the requester) ---
export const cancelRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params; // Get request ID from URL: /api/collaboration-requests/:requestId/cancel
  const userId = req.user.id; // Logged-in user (must be the requester)

  console.log(`--- CANCEL COLLABORATION REQUEST ${requestId} ---`);
  console.log(`Attempt by User ID: ${userId}`);

  if (!requestId || isNaN(parseInt(requestId))) {
    res.status(400);
    throw new Error("Valid request ID parameter is required.");
  }

  const transaction = await sequelize.transaction();
  try {
    const request = await CollaborationRequest.findByPk(requestId, {
      transaction,
    });

    if (!request) {
      await transaction.rollback();
      res.status(404);
      throw new Error("Request not found");
    }

    // Verify the logged-in user is the one who sent the request
    if (request.requesterId !== userId) {
      await transaction.rollback();
      res.status(403);
      throw new Error("Not authorized to cancel this request");
    }

    // Can only cancel pending requests
    if (request.status !== "pending") {
      await transaction.rollback();
      res.status(400);
      throw new Error(`Cannot cancel request with status '${request.status}'.`);
    }

    // Delete the request
    await request.destroy({ transaction });
    console.log(
      `Request ${requestId} cancelled successfully by user ${userId}.`
    );

    await transaction.commit();

    // Use 200 OK with message, or 204 No Content
    res
      .status(200)
      .json({ success: true, message: "Request cancelled successfully" });
    // res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    console.error("Error canceling request:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to cancel request" });
  }
});

// --- Compatibility Exports (if needed elsewhere, but prefer named exports) ---
export default {
  sendRequest,
  getReceivedRequests,
  getSentRequests,

  cancelRequest,
};
