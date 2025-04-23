// controllers/collaborationRequestController.js
import db from "../models/index.js";

const { CollaborationRequest, Project, Member } = db;

export const sendRequest = async (req, res) => {
  try {
    const project = await Project.findByPk(req.body.projectId);

    if (project.owner_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Owner cannot request to join",
      });
    }

    const existing = await CollaborationRequest.findOne({
      where: { project_id: req.body.projectId, user_id: req.user.id },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already requested",
      });
    }

    const request = await CollaborationRequest.create({
      project_id: req.body.projectId,
      user_id: req.user.id,
      message: req.body.message,
    });

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReceivedRequests = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { owner_id: req.user.id },
      attributes: ["id"],
    });

    const projectIds = projects.map((p) => p.id);

    const requests = await CollaborationRequest.findAll({
      where: { project_id: projectIds },
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSentRequests = async (req, res) => {
  try {
    const requests = await CollaborationRequest.findAll({
      where: { user_id: req.user.id },
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const request = await CollaborationRequest.findByPk(req.params.requestId);

    const project = await Project.findByPk(request.project_id);
    if (project.owner_id !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await request.update({ status: "accepted" });
    await Member.create({
      project_id: request.project_id,
      user_id: request.user_id,
      role: "collaborator",
    });

    res.json({ success: true, message: "Request accepted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const request = await CollaborationRequest.findByPk(req.params.requestId);
    const project = await Project.findByPk(request.project_id);
    if (project.owner_id !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await request.update({ status: "rejected" });

    res.json({ success: true, message: "Request rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelRequest = async (req, res) => {
  try {
    const request = await CollaborationRequest.findByPk(req.params.requestId);
    if (request.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await request.destroy();

    res.json({ success: true, message: "Request cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
