import db from "../models/index.js"; // Import the default export
const { CollaborationRequest, Publication, User } = db; // Destructure models
import { Op } from "sequelize";

export const sendRequest = async (req, res) => {
  const { publicationId, message } = req.body;
  const senderId = req.user?.id; // From authMiddleware

  if (!senderId)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  if (!publicationId)
    return res
      .status(400)
      .json({ success: false, message: "Publication ID is required" });

  try {
    const publication = await Publication.findByPk(publicationId);

    if (!publication)
      return res
        .status(404)
        .json({ success: false, message: "Publication not found" });
    if (publication.collaborationStatus !== "open")
      return res.status(400).json({
        success: false,
        message: "Publication is not open for collaboration requests",
      });

    const receiverId = publication.ownerId;

    if (senderId === receiverId)
      return res.status(400).json({
        success: false,
        message: "Cannot send collaboration request for your own publication",
      });

    // Check if a request already exists (pending or accepted)
    const existingRequest = await CollaborationRequest.findOne({
      where: {
        publicationId: publicationId,
        senderId: senderId,
        receiverId: receiverId,
        status: { [Op.in]: ["pending", "accepted"] },
      },
    });

    if (existingRequest)
      return res.status(400).json({
        success: false,
        message: "A collaboration request already exists or has been accepted",
      });

    const newRequest = await CollaborationRequest.create({
      publicationId,
      senderId,
      receiverId,
      message: message || "",
      status: "pending",
    });

    // Fetch related data to return if needed immediately
    const populatedRequest = await CollaborationRequest.findByPk(
      newRequest.id,
      {
        include: [
          { model: User, as: "sender", attributes: ["id", "username"] },
          { model: User, as: "receiver", attributes: ["id", "username"] },
          {
            model: Publication,
            as: "publication",
            attributes: ["id", "title"],
          },
        ],
      }
    );

    res.status(201).json({
      success: true,
      message: "Collaboration request sent successfully",
      data: populatedRequest,
    });
  } catch (error) {
    console.error("Error sending collaboration request:", error);
    res.status(500).json({
      success: false,
      message: "Server Error sending request",
      error: error.message,
    });
  }
};

// Helper to format requests for frontend
const formatRequestForFrontend = (request) => {
  const reqJson = request.toJSON ? request.toJSON() : request; // Handle raw vs Sequelize instances
  return {
    id: reqJson.id,
    publicationId: reqJson.publicationId,
    publicationTitle: reqJson.publication?.title || "N/A",
    senderId: reqJson.senderId,
    senderName: reqJson.sender?.username || "N/A",
    receiverId: reqJson.receiverId,
    receiverName: reqJson.receiver?.username || "N/A",
    message: reqJson.message,
    status: reqJson.status,
    createdAt: reqJson.createdAt,
  };
};

export const getReceivedRequests = async (req, res) => {
  const receiverId = req.user?.id;
  if (!receiverId)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });

  try {
    const requests = await CollaborationRequest.findAll({
      where: { receiverId: receiverId /*, status: 'pending' */ }, // Filter by status if needed
      include: [
        { model: User, as: "sender", attributes: ["id", "username"] },
        { model: Publication, as: "publication", attributes: ["id", "title"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedRequests = requests.map(formatRequestForFrontend);
    res.status(200).json({ success: true, data: formattedRequests });
  } catch (error) {
    console.error("Error fetching received requests:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching received requests",
      error: error.message,
    });
  }
};

export const getSentRequests = async (req, res) => {
  const senderId = req.user?.id;
  if (!senderId)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });

  try {
    const requests = await CollaborationRequest.findAll({
      where: { senderId: senderId },
      include: [
        { model: User, as: "receiver", attributes: ["id", "username"] },
        { model: Publication, as: "publication", attributes: ["id", "title"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedRequests = requests.map(formatRequestForFrontend);
    res.status(200).json({ success: true, data: formattedRequests });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching sent requests",
      error: error.message,
    });
  }
};

// Helper function to update request status
const updateRequestStatus = async (req, res, newStatus, checkRole) => {
  const { requestId } = req.params;
  const userId = req.user?.id;

  if (!userId)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  if (!requestId)
    return res
      .status(400)
      .json({ success: false, message: "Request ID is required." });

  try {
    const request = await CollaborationRequest.findByPk(requestId);
    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Collaboration request not found" });

    // Authorization Check
    if (checkRole === "receiver" && request.receiverId !== userId)
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this request",
      });
    if (checkRole === "sender" && request.senderId !== userId)
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this request",
      });

    // Can only update if pending
    if (request.status !== "pending")
      return res.status(400).json({
        success: false,
        message: `Cannot update request, status is already '${request.status}'`,
      });

    const [updatedCount] = await CollaborationRequest.update(
      { status: newStatus },
      { where: { id: requestId } }
    );

    if (updatedCount > 0) {
      // Optionally update publication status if request is accepted
      if (newStatus === "accepted") {
        await Publication.update(
          { collaborationStatus: "in_progress" },
          { where: { id: request.publicationId } }
        );
      }
      const updatedRequest = await CollaborationRequest.findByPk(requestId); // Fetch updated
      res.status(200).json({
        success: true,
        message: `Request ${newStatus} successfully`,
        data: updatedRequest,
      });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Request found but update failed." });
    }
  } catch (error) {
    console.error(`Error updating request to ${newStatus}:`, error);
    res.status(500).json({
      success: false,
      message: `Server Error updating request`,
      error: error.message,
    });
  }
};

export const acceptRequest = async (req, res) => {
  await updateRequestStatus(req, res, "accepted", "receiver");
};

export const rejectRequest = async (req, res) => {
  await updateRequestStatus(req, res, "rejected", "receiver");
};

export const cancelRequest = async (req, res) => {
  await updateRequestStatus(req, res, "cancelled", "sender");
};
