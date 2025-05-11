import * as ContactSubmissionModel from "../models/ContactSubmission.js";

export const submitContactForm = async (req, res) => {
  const { name, email, issueType, message } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: "Name is required." });
  if (!email || !email.trim())
    return res.status(400).json({ message: "Email is required." });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ message: "Invalid email format." });
  if (!message || !message.trim())
    return res.status(400).json({ message: "Message is required." });

  try {
    const submission = await ContactSubmissionModel.create({
      name,
      email,
      issueType,
      message,
    });
    res.status(201).json({
      message:
        "Support request submitted successfully! We will get back to you soon.",
      submissionId: submission.id,
    });
  } catch (error) {
    console.error(
      "Error in contactController.submitContactForm:",
      error.message,
      error.stack
    );
    res.status(500).json({
      message: "Server error submitting contact form. Please try again later.",
    });
  }
};

export const getAllSubmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const resolvedQuery = req.query.resolved;
    let resolved = null;
    if (resolvedQuery === "true") resolved = true;
    if (resolvedQuery === "false") resolved = false;

    const data = await ContactSubmissionModel.getAll(page, limit, resolved);
    res.status(200).json(data);
  } catch (error) {
    console.error(
      "Error in contactController.getAllSubmissions:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Server error fetching submissions." });
  }
};

export const getSubmissionById = async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id, 10);
    if (isNaN(submissionId))
      return res.status(400).json({ message: "Invalid submission ID." });

    const submission = await ContactSubmissionModel.findById(submissionId);
    if (!submission)
      return res.status(404).json({ message: "Submission not found." });

    res.status(200).json(submission);
  } catch (error) {
    console.error(
      "Error in contactController.getSubmissionById:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Server error fetching submission." });
  }
};

export const toggleResolveSubmission = async (req, res) => {
  const { id } = req.params;
  const { resolved } = req.body; // This should be a boolean from frontend: true or false

  console.log(
    `[Controller toggleResolveSubmission] Received for ID: ${id}, New resolved status: ${resolved}`
  );

  const submissionId = parseInt(id, 10);
  if (isNaN(submissionId)) {
    return res.status(400).json({ message: "Invalid submission ID." });
  }
  if (typeof resolved !== "boolean") {
    return res.status(400).json({
      message: 'Invalid "resolved" status provided. Must be true or false.',
    });
  }

  try {
    console.log(
      "[Controller toggleResolveSubmission] About to call ContactSubmissionModel.markAsResolved"
    );
    if (typeof ContactSubmissionModel.markAsResolved !== "function") {
      console.error(
        "CRITICAL: ContactSubmissionModel.markAsResolved is not a function!"
      );
      return res
        .status(500)
        .json({ message: "Server configuration error [CSM-MRNF]." });
    }

    const success = await ContactSubmissionModel.markAsResolved(
      submissionId,
      resolved
    );
    console.log(
      `[Controller toggleResolveSubmission] Result from model for ID ${submissionId}: ${success}`
    );

    if (!success) {
      // Check if the item actually exists before concluding "not found or no change"
      const checkSubmission = await ContactSubmissionModel.findById(
        submissionId
      );
      if (!checkSubmission) {
        return res.status(404).json({ message: "Submission not found." });
      }
      // If it exists but success was false, it means the update query affected 0 rows.
      // This could happen if it was already in the desired state, but our model's `markAsResolved` should return true if ID exists.
      // Or, if there was an issue not caught as an error by sequelize.query for an update.
      return res.status(304).json({
        message:
          "Submission status was not changed (possibly already in desired state or update affected 0 rows).",
      });
    }

    const updatedSubmission = await ContactSubmissionModel.findById(
      submissionId
    );
    if (!updatedSubmission) {
      // Should ideally not happen if success was true
      console.error(
        `[Controller toggleResolveSubmission] Could not refetch submission ${submissionId} after update.`
      );
      return res
        .status(404)
        .json({ message: "Submission updated but could not be refetched." });
    }

    res.status(200).json({
      message: `Submission ${
        resolved ? "marked as resolved" : "marked as unresolved"
      }.`,
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error(
      "Error in contactController.toggleResolveSubmission:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Server error updating submission status." });
  }
};
