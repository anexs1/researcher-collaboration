// backend/controllers/collaborationRequestController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
// --- Import the emit function from the dedicated setup file ---
import { emitToUser } from "../config/socketSetup.js"; // Adjust path if needed

const { CollaborationRequest, Project, User, Member, sequelize } = db;

// --- Controller to send a request ---
export const sendRequest = asyncHandler(async (req, res) => {
  const transaction = await sequelize.transaction();
  console.log("--- SEND COLLABORATION REQUEST ---");
  const requester = req.user; // Get user from protect middleware

  try {
    const { projectId, message } = req.body;

    // Validation and Checks
    if (!requester?.id) {
      throw new Error("Authentication required.");
    }
    if (!projectId || isNaN(parseInt(projectId))) {
      throw new Error("Valid Project ID is required.");
    }
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "title", "ownerId"],
      transaction,
    });
    if (!project) {
      throw new Error("Project not found.");
    }
    const recipientId = project.ownerId;
    if (requester.id === recipientId) {
      throw new Error("You cannot request to join your own project.");
    }
    const isAlreadyMember = await Member.findOne({
      where: { user_id: requester.id, project_id: projectId },
      transaction,
    });
    if (isAlreadyMember) {
      throw new Error("You are already a member of this project.");
    }
    const existingPendingRequest = await CollaborationRequest.findOne({
      where: {
        projectId: projectId,
        requesterId: requester.id,
        status: "pending",
      },
      transaction,
    });
    if (existingPendingRequest) {
      res.status(400).json({
        success: false,
        message: "You already have a pending request...",
      });
      return;
    }

    // Create Request
    const request = await CollaborationRequest.create(
      {
        projectId: projectId,
        requesterId: requester.id,
        requestMessage: message || null,
        status: "pending",
      },
      { transaction }
    );
    console.log(`CollaborationRequest created with ID: ${request.id}`);

    // Commit Transaction BEFORE sending notification
    await transaction.commit();
    console.log("Send request transaction committed successfully.");

    // --- Send Real-Time Notification ---
    if (request && project && requester) {
      const notificationData = {
        type: "new_request",
        message: `User '${requester.username}' sent a request to join your project '${project.title}'.`,
        requestId: request.id,
        projectId: project.id,
        projectTitle: project.title,
        requesterUsername: requester.username,
        requesterId: requester.id,
        timestamp: new Date().toISOString(),
      };
      const emitted = emitToUser(
        recipientId,
        "new_collaboration_request",
        notificationData
      ); // Use imported function
      if (!emitted) {
        console.log(
          `Owner ${recipientId} not connected via socket for new request notification.`
        );
        // TODO: Store notification in DB for offline users
      }
    }
    // ---------------------------------

    // Success Response
    res.status(201).json({
      success: true,
      message: "Collaboration request sent successfully.",
      data: request,
    });
  } catch (error) {
    // --- Error Handling & Rollback ---
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error("Error sending collaboration request:", error);
    let statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    let message = error.message || "Server error sending request.";
    // Handle specific error types if needed...
    if (!res.headersSent) {
      res.status(statusCode);
    }
    res.json({ success: false, message: message });
  }
});

// --- getReceivedRequests Controller --- (Remains the same)
export const getReceivedRequests = asyncHandler(async (req, res) => {
  /* ... */
});

// --- getSentRequests Controller --- (Remains the same)
export const getSentRequests = asyncHandler(async (req, res) => {
  /* ... */
});

// --- respondToRequest Controller --- (Includes emitToUser for response)
export const respondToRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  const userId = req.user?.id; // Owner ID

  if (!userId) {
    /* ... auth error ... */
  }
  if (!["approved", "rejected"].includes(status)) {
    /* ... invalid status ... */
  }
  if (!requestId || isNaN(parseInt(requestId))) {
    /* ... invalid ID ... */
  }

  const transaction = await sequelize.transaction();
  try {
    // Find request, include project details
    const request = await CollaborationRequest.findByPk(requestId, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: [
            "id",
            "title",
            "ownerId",
            "requiredCollaborators",
            "status",
          ],
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!request) {
      /* ... not found ... */
    }
    if (!request.project || request.project.ownerId !== userId) {
      /* ... forbidden ... */
    }
    if (request.status !== "pending") {
      /* ... already processed ... */
    }

    // Update request
    request.status = status;
    if (CollaborationRequest.rawAttributes.respondedAt) {
      request.respondedAt = new Date();
    }
    await request.save({ transaction });
    console.log(`Request ${requestId} status updated to ${status}.`);

    const projectId = request.projectId;
    const requesterIdToNotify = request.requesterId; // User who sent original request

    // If approved: Add member & update project logic (remains the same)
    if (status === "approved") {
      // ... (logic to find/create Member and update Project count/status) ...
      try {
        const existingMember = await Member.findOne({
          where: { user_id: requesterIdToNotify, project_id: projectId },
          transaction,
        });
        let memberAddedOrExisted = false;
        if (!existingMember) {
          await Member.create(
            {
              userId: requesterIdToNotify,
              projectId: projectId,
              role: "member",
              status: "active",
            },
            { transaction }
          );
          memberAddedOrExisted = true;
          console.log(`User ${requesterIdToNotify} added as member.`);
        } else {
          memberAddedOrExisted = true;
          console.log(`User ${requesterIdToNotify} already a member.`);
        }

        if (memberAddedOrExisted) {
          const projectToUpdate = await Project.findByPk(projectId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });
          if (!projectToUpdate)
            throw new Error(
              `Consistency error: Project ${projectId} not found.`
            );
          if (projectToUpdate.requiredCollaborators > 0) {
            projectToUpdate.requiredCollaborators -= 1;
            if (projectToUpdate.requiredCollaborators === 0) {
              projectToUpdate.status = "Closed"; // Adjust status name if needed
            }
            await projectToUpdate.save({ transaction });
            console.log(
              `Project ${projectId} updated. Required: ${projectToUpdate.requiredCollaborators}, Status: ${projectToUpdate.status}`
            );
          }
        }
      } catch (memberOrProjectError) {
        console.error(
          "Error during member/project update:",
          memberOrProjectError
        );
        throw new Error(
          "Failed to process membership or project update after approval."
        );
      }
    } // End if approved

    // Commit Transaction BEFORE sending notification
    await transaction.commit();
    console.log("Response transaction committed successfully.");

    // --- Notify Requester of the Decision ---
    const notificationData = {
      type: `request_${status}`, // e.g., request_approved
      message: `Your request to join project '${
        request.project?.title || "Unknown Project"
      }' has been ${status}.`,
      projectId: projectId,
      projectTitle: request.project?.title || "Unknown Project",
      status: status,
      timestamp: new Date().toISOString(),
    };
    const emitted = emitToUser(
      requesterIdToNotify,
      "request_response",
      notificationData
    ); // Use imported function
    if (!emitted) {
      console.log(
        `Requester ${requesterIdToNotify} not connected for request response notification.`
      );
      // TODO: Store notification in DB for offline users
    }
    // ------------------------------------

    // Success Response to the owner
    res.status(200).json({
      success: true,
      message: `Request ${status} successfully.`,
      data: {
        /* ... updated request info ... */
      },
    });
  } catch (error) {
    // --- Error Handling & Rollback ---
    if (transaction && !transaction.finished) {
      await transaction.rollback();
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

// --- cancelRequest Controller --- (Remains the same)
export const cancelRequest = asyncHandler(async (req, res) => {
  /* ... */
});
