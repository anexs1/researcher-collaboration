// import CollaborationRequest from "../models/collaborationRequestModel.js";
// import Publication from "../models/publicationModel.js";
// import User from "../models/user.js";

// // Send a collaboration request
// export const sendRequest = async (req, res) => {
//   try {
//     const { publicationId } = req.body;
//     const userId = req.user.id;

//     // Check if the publication exists
//     const publication = await Publication.findByPk(publicationId);
//     if (!publication) {
//       return res.status(404).json({ message: "Publication not found" });
//     }

//     // Prevent duplicate requests
//     const existingRequest = await CollaborationRequest.findOne({
//       where: { requesterId: userId, publicationId },
//     });

//     if (existingRequest) {
//       return res.status(400).json({ message: "Request already sent" });
//     }

//     const newRequest = await CollaborationRequest.create({
//       requesterId: userId,
//       publicationId,
//     });

//     res.status(201).json(newRequest);
//   } catch (error) {
//     console.error("Error sending request:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // Get collaboration requests for the logged-in user
// export const getRequests = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const requests = await CollaborationRequest.findAll({
//       where: { requesterId: userId },
//       include: [
//         { model: Publication, attributes: ["title"] },
//         { model: User, as: "Requester", attributes: ["name"] },
//       ],
//     });

//     res.status(200).json(requests);
//   } catch (error) {
//     console.error("Error fetching requests:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // Approve a collaboration request
// export const approveRequest = async (req, res) => {
//   try {
//     const { requestId } = req.params;

//     const request = await CollaborationRequest.findByPk(requestId);
//     if (!request) {
//       return res.status(404).json({ message: "Request not found" });
//     }
//     request.status = "approved";
//     await request.save();
//     4;

//     res.status(200).json({ message: "Request approved", request });
//     const requesterEmail = await User.findOne({
//       where: { id: request.requesterId },
//       attributes: ["email"],
//     });
//     // Send email notification to the requester and the publication owner

//     const publicationOwnerEmail = await User.findOne({
//       where: { id: request.publication.userId },
//       attributes: ["email"],
//     });

//     res.status(200).json({ message: "Request approved", request });
//   } catch (error) {
//     console.error("Error approving request:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
