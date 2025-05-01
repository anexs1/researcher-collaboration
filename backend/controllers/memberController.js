// File: backend/controllers/memberController.js

import db from "../models/index.js";
const { Project, Member, User } = db;

class MemberController {
  /**
   * Get all members for a specific project.
   * Responds with an array of member objects structured for the frontend modal.
   */
  async getProjectMembers(req, res) {
    try {
      const { projectId } = req.params; // Use destructuring

      // Optional: Validate if the requesting user has access to this project
      // (Add middleware or check here if needed)

      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      // Fetch Member records (representing the link between User and Project),
      // including the associated User details.
      const memberships = await Member.findAll({
        where: { projectId: projectId },
        include: [
          {
            model: User,
            // Ensure 'User' matches the model name or alias used in Member.associate
            // as: 'user', // Uncomment and adjust alias if needed
            attributes: [
              "id", // User's ID (Primary Key)
              "name", // User's Name
              "email", // User's Email
              "avatar", // User's Avatar URL
            ],
            required: true, // Ensures we only get memberships linked to an existing user
          },
        ],
        // Consider ordering for better display in the frontend modal
        order: [[User, "name", "ASC"]], // Order alphabetically by User's name
        // Alternative: order: [['createdAt', 'ASC']] // Order by when they became members
      });

      // Map the fetched membership records to the specific format needed by MemberListModal
      const memberListForFrontend = memberships
        .map((membership) => {
          // Basic safety check in case the User include somehow failed
          if (!membership.User || !membership.User.id) {
            console.warn(
              `Membership record ID ${membership.id} is missing associated User data or User ID.`
            );
            return null; // Skip this record if essential User data is missing
          }

          // Construct the object for the frontend list item
          return {
            id: membership.User.id, // <<< Key fix: Use the User's unique ID
            username: membership.User.name, // Map User.name to username
            email: membership.User.email, // Pass email along
            profilePictureUrl: membership.User.avatar, // Map User.avatar to profilePictureUrl
            role: membership.role, // Role comes from the Member record
            // Add other relevant fields if needed by frontend, e.g.:
            // status: membership.status,
            // memberSince: membership.createdAt // or joined_at if you have that field
          };
        })
        .filter((member) => member !== null); // Remove any entries that failed the safety check

      // Respond with the standard success structure, using 'data' key
      res.json({
        success: true,
        data: memberListForFrontend, // Key 'data' holding the array
      });
    } catch (err) {
      console.error(
        `Error fetching members for project ${req.params.projectId}:`,
        err
      ); // Log error context
      res.status(500).json({
        success: false,
        message: "Failed to fetch project members due to a server error.",
        // Provide minimal error info in production
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  /**
   * Add a user as a member to a project.
   * Assumes req.user contains the authenticated user's ID.
   */
  async addProjectMember(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id; // Get authenticated user's ID
      const { role = "Collaborator", status = "pending" } = req.body; // Default role/status

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Authentication required." });
      }

      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      // Check if user is already a member
      const existingMember = await Member.findOne({
        where: { projectId, userId },
      });

      if (existingMember) {
        return res.status(409).json({
          // Use 409 Conflict for existing resource
          success: false,
          message: "User is already a member of this project.",
          // Optionally return existing member data if needed
          // member: { id: existingMember.id, role: existingMember.role, status: existingMember.status }
        });
      }

      // Create the new membership record
      const newMember = await Member.create({
        projectId,
        userId,
        role,
        status,
      });

      // Refetch the new member including user details for the response
      const memberWithUser = await Member.findByPk(newMember.id, {
        include: {
          model: User,
          attributes: ["id", "name", "email", "avatar"],
        },
      });

      // Optionally increment project counter if status is immediately 'approved'
      if (memberWithUser && memberWithUser.status === "approved") {
        // Ensure atomicity if needed, or handle potential race conditions
        await project.increment("approved_collaborators_count");
      }

      // Check if memberWithUser and User exist before structuring response
      if (!memberWithUser || !memberWithUser.User) {
        console.error(
          `Failed to fetch user details for newly added member ID ${newMember.id}`
        );
        // Return basic success but indicate potential data issue
        return res.status(201).json({
          success: true,
          message:
            "Member added, but user details could not be immediately retrieved.",
          member: {
            id: newMember.id,
            role: newMember.role,
            status: newMember.status,
          },
        });
      }

      // Respond with the newly created member details (matching frontend format ideally)
      res.status(201).json({
        success: true,
        message: "Member added successfully.", // Add a success message
        // Structure the response similar to getProjectMembers for consistency
        member: {
          id: memberWithUser.User.id, // User ID
          username: memberWithUser.User.name,
          email: memberWithUser.User.email,
          profilePictureUrl: memberWithUser.User.avatar,
          role: memberWithUser.role,
          status: memberWithUser.status,
          // Add membership ID if frontend needs it for updates/deletes
          membershipId: memberWithUser.id,
          // joined_at: memberWithUser.createdAt // Use createdAt from Member model
        },
      });
    } catch (err) {
      console.error(
        `Error adding member to project ${req.params.projectId}:`,
        err
      );
      // Handle potential validation errors (e.g., from Sequelize)
      if (err.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed.",
          errors: err.errors.map((e) => ({
            field: e.path,
            message: e.message,
          })),
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to add member due to a server error.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  /**
   * Update a member's status or role within a project.
   */
  async updateMemberStatus(req, res) {
    try {
      const { projectId, memberId } = req.params;
      const { status, role } = req.body;

      // Validate input: at least status or role should be provided
      if (status === undefined && role === undefined) {
        return res.status(400).json({
          success: false,
          message: "No update provided. Please specify 'status' or 'role'.",
        });
      }

      // Find the specific membership record
      const member = await Member.findOne({
        where: {
          id: memberId, // Find by Membership ID
          projectId: projectId,
        },
        // Include project only if needed for checks/updates (like counts)
        // include: { model: Project, attributes: ["id"] }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: `Membership record (ID: ${memberId}) not found for this project (ID: ${projectId}).`,
        });
      }

      // Get project separately only if needed for counter updates
      let project = null;
      if (status && status !== member.status) {
        project = await Project.findByPk(projectId);
        if (!project) {
          // This case should be rare if the member record existed, but good check
          return res
            .status(404)
            .json({ success: false, message: "Associated project not found." });
        }
      }

      const previousStatus = member.status;
      const changes = {};

      if (status !== undefined && status !== member.status) {
        changes.status = status;
      }
      if (role !== undefined && role !== member.role) {
        changes.role = role;
      }

      // If no actual changes needed, return early
      if (Object.keys(changes).length === 0) {
        return res.json({
          success: true,
          message: "No changes detected.",
          member,
        }); // Return current member data
      }

      // Apply the updates
      await member.update(changes);

      // Update project counter if status changed and project was fetched
      if (project && changes.status) {
        if (changes.status === "approved") {
          await project.increment("approved_collaborators_count");
          await project.reload(); // Reload to get updated count
        } else if (previousStatus === "approved") {
          await project.decrement("approved_collaborators_count");
          await project.reload(); // Reload to get updated count
        }
      }

      // Respond with updated member details
      res.json({
        success: true,
        message: "Member updated successfully.",
        member: {
          // Return consistent structure
          membershipId: member.id,
          role: member.role,
          status: member.status,
          // Include User ID if needed
          // userId: member.userId
        },
        // Conditionally include count if it was updated
        ...(project &&
          changes.status && {
            approved_collaborators_count: project.approved_collaborators_count,
          }),
      });
    } catch (err) {
      console.error(
        `Error updating member ${req.params.memberId} for project ${req.params.projectId}:`,
        err
      );
      if (err.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed.",
          errors: err.errors.map((e) => ({
            field: e.path,
            message: e.message,
          })),
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to update member due to a server error.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
}

// Export an instance of the controller
export default new MemberController();
