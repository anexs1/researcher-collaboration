// File: controllers/memberController.js

import db from "../models/index.js"; // ✅ Correct default import
const { Project, Member, User } = db; // ✅ Destructuring from default export

class MemberController {
  // Get all members for a project
  async getProjectMembers(req, res) {
    try {
      const project = await Project.findByPk(req.params.projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const members = await Member.findAll({
        where: { projectId: req.params.projectId },
        include: {
          model: User,
          attributes: ["id", "name", "email", "avatar"],
        },
        order: [["joined_at", "DESC"]],
      });

      res.json({
        success: true,
        members: members.map((m) => ({
          id: m.id,
          role: m.role,
          status: m.status,
          joined_at: m.joined_at,
          user: m.User,
        })),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch members",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  // Add a member to a project
  async addProjectMember(req, res) {
    try {
      const project = await Project.findByPk(req.params.projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const existingMember = await Member.findOne({
        where: {
          projectId: req.params.projectId,
          userId: req.user.id,
        },
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "User is already a member of this project",
          member: existingMember,
        });
      }

      const newMember = await Member.create({
        projectId: req.params.projectId,
        userId: req.user.id,
        role: req.body.role || "Collaborator",
        status: req.body.status || "pending",
      });

      const memberWithUser = await Member.findByPk(newMember.id, {
        include: {
          model: User,
          attributes: ["id", "name", "email", "avatar"],
        },
      });

      if (memberWithUser.status === "approved") {
        await project.increment("approved_collaborators_count");
      }

      res.status(201).json({
        success: true,
        member: {
          id: memberWithUser.id,
          role: memberWithUser.role,
          status: memberWithUser.status,
          joined_at: memberWithUser.joined_at,
          user: memberWithUser.User,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to add member",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  // Update member status
  async updateMemberStatus(req, res) {
    try {
      const member = await Member.findOne({
        where: {
          id: req.params.memberId,
          projectId: req.params.projectId,
        },
        include: {
          model: Project,
          attributes: ["id"],
        },
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      const project = await Project.findByPk(req.params.projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const previousStatus = member.status;
      let changes = {};

      if (req.body.status) {
        changes.status = req.body.status;
      }

      if (req.body.role) {
        changes.role = req.body.role;
      }

      await member.update(changes);

      if (req.body.status && req.body.status !== previousStatus) {
        if (req.body.status === "approved") {
          await project.increment("approved_collaborators_count");
        } else if (previousStatus === "approved") {
          await project.decrement("approved_collaborators_count");
        }
      }

      res.json({
        success: true,
        member: {
          id: member.id,
          role: member.role,
          status: member.status,
          joined_at: member.joined_at,
        },
        approved_collaborators_count: project.approved_collaborators_count,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to update member",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
}

export default new MemberController();
