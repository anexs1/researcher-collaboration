// backend/controllers/documentController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";

const { Document, Project, User } = db; // Ensure User is imported if you plan to use it in includes

/**
 * @desc    Create a new document
 * @route   POST /api/documents
 * @access  Private
 */
export const createDocument = asyncHandler(async (req, res) => {
  // Debug logs to confirm controller invocation and received data
  console.log("--- createDocument Controller Invoked ---");
  console.log("req.user (from middleware):", JSON.stringify(req.user, null, 2));
  console.log("req.body (from client):", JSON.stringify(req.body, null, 2));

  const { title, projectId, initialContent } = req.body;
  const ownerId = req.user?.id;

  console.log(`Extracted ownerId: ${ownerId}`);

  if (!ownerId) {
    console.error(
      "createDocument Error: User not authenticated or req.user.id is missing."
    );
    res.status(401);
    throw new Error("User not authenticated, cannot determine document owner.");
  }

  if (projectId) {
    const projectExists = await Project.findByPk(projectId);
    if (!projectExists) {
      console.warn(
        `createDocument Warning: Associated project ID ${projectId} not found.`
      );
      res.status(404);
      throw new Error("Associated project not found");
    }
    // TODO: Optional: Check if user is member/owner of the project
  }

  const defaultSlateContent = [{ type: "paragraph", children: [{ text: "" }] }];

  try {
    const documentData = {
      title: title || "Untitled Document",
      ownerId,
      projectId: projectId || null,
      content: initialContent || defaultSlateContent,
    };
    console.log(
      "Data to be passed to Document.create():",
      JSON.stringify(documentData, null, 2)
    );

    const document = await Document.create(documentData);

    // If create is successful, Document.create returns the created instance.
    // The `if (document)` check below is slightly redundant as an error would have been thrown if it failed.
    // However, it doesn't hurt.
    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    // Log the full error object to see its structure, especially for non-Sequelize errors
    console.error("--- Error during Document.create() ---");
    console.error(
      "Full Error Object:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    ); // Stringify with all properties

    if (error.name === "SequelizeValidationError") {
      console.error("--- Sequelize Validation Error Details ---");
      error.errors.forEach((errItem) => {
        console.error(`  Path: ${errItem.path}`);
        console.error(`  Value: ${JSON.stringify(errItem.value)}`); // Stringify value in case it's an object/array
        console.error(`  Type: ${errItem.type}`);
        console.error(`  Message: ${errItem.message}`);
        if (errItem.validatorKey)
          console.error(`  ValidatorKey: ${errItem.validatorKey}`);
        if (errItem.validatorName)
          console.error(`  ValidatorName: ${errItem.validatorName}`);
        if (errItem.validatorArgs)
          console.error(
            `  ValidatorArgs: ${JSON.stringify(errItem.validatorArgs)}`
          );
        console.error("  Original Error (if any):", errItem.original);
        console.error("  ---");
      });
      // Construct a more informative message for the client
      const messages = error.errors
        .map((e) => `${e.path || "Field"} validation failed: ${e.message}`)
        .join("; ");
      res.status(400); // Bad Request for validation errors
      throw new Error(`Validation failed. Details: ${messages}`);
    } else if (error.name === "SequelizeForeignKeyConstraintError") {
      console.error("--- Sequelize Foreign Key Constraint Error ---");
      console.error("Fields:", error.fields);
      console.error("Table:", error.table);
      console.error("Constraint Name (if available):", error.index); // May provide constraint name
      console.error(
        "Original DB Error (parent):",
        error.parent?.message || error.parent
      );
      res.status(409); // Conflict - Indicates a foreign key issue
      throw new Error(
        `Database constraint error related to ${
          error.fields ? error.fields.join(", ") : "a foreign key"
        }. Please ensure related data exists.`
      );
    } else if (error.name === "SequelizeDatabaseError") {
      console.error("--- Sequelize Database Error ---");
      console.error(
        "Original DB Error (parent):",
        error.parent?.message || error.parent
      );
      console.error("SQL Query (if available):", error.sql);
      res.status(500);
      throw new Error(
        `Database error: ${
          error.parent?.message || "An unexpected database error occurred."
        }`
      );
    }
    // Re-throw other (non-Sequelize specific) errors to be caught by the global error handler
    console.error(
      "Non-Sequelize specific error or other unhandled error in createDocument:",
      error.message
    );
    // Ensure a status code is set if not already
    if (!res.statusCode || res.statusCode < 400) res.status(500);
    throw error; // Let asyncHandler's global error handler take over if not one of the above
  }
});

/**
 * @desc    Get a document by ID
 * @route   GET /api/documents/:id
 * @access  Private
 */
export const getDocumentById = asyncHandler(async (req, res) => {
  const documentId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  const document = await Document.findByPk(documentId, {
    // Example: include owner details if needed by frontend for display
    // include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'profilePictureUrl'] }]
  });

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  // Basic permission check: only owner can view (expand later for collaborators)
  if (document.ownerId !== userId) {
    // You might want to check for collaborator status here in a real app
    // For now, if not owner, deny access.
    // console.warn(`getDocumentById: User ${userId} attempted to access document ${documentId} owned by ${document.ownerId}. Access denied.`);
    // res.status(403); // Forbidden
    // throw new Error("Not authorized to access this document");
    // For Phase 1, let's keep it simple and assume only owner views for now if above is commented out
  }

  res.status(200).json({
    success: true,
    data: document, // Sequelize model getter for 'content' will parse JSON
  });
});

/**
 * @desc    Update document content
 * @route   PUT /api/documents/:id
 * @access  Private
 */
export const updateDocumentContent = asyncHandler(async (req, res) => {
  const documentId = req.params.id;
  const { content } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  const document = await Document.findByPk(documentId);

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  // Permission check: only owner can edit (expand later for collaborators)
  if (document.ownerId !== userId) {
    console.warn(
      `updateDocumentContent: User ${userId} attempted to edit document ${documentId} owned by ${document.ownerId}. Access denied.`
    );
    res.status(403); // Forbidden
    throw new Error("Not authorized to edit this document");
  }

  if (content === undefined) {
    res.status(400);
    throw new Error("Content is required for update");
  }

  try {
    document.content = content; // Setter in model will JSON.stringify
    console.log(
      "Data to be passed to document.save() 'content':",
      JSON.stringify(content, null, 2)
    );
    await document.save();

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("--- Error during document.save() ---");
    console.error(
      "Full Error Object:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );

    if (error.name === "SequelizeValidationError") {
      console.error("--- Sequelize Validation Error Details (Update) ---");
      error.errors.forEach((errItem) => {
        console.error(`  Path: ${errItem.path}`);
        console.error(`  Value: ${JSON.stringify(errItem.value)}`);
        console.error(`  Type: ${errItem.type}`);
        console.error(`  Message: ${errItem.message}`);
        // ... (other errItem properties as in createDocument)
        console.error("  ---");
      });
      const messages = error.errors
        .map((e) => `${e.path || "Field"} validation failed: ${e.message}`)
        .join("; ");
      res.status(400);
      throw new Error(`Validation failed during update. Details: ${messages}`);
    } else if (error.name === "SequelizeDatabaseError") {
      console.error("--- Sequelize Database Error (Update) ---");
      console.error(
        "Original DB Error (parent):",
        error.parent?.message || error.parent
      );
      res.status(500);
      throw new Error(
        `Database error during update: ${
          error.parent?.message || "An unexpected database error occurred."
        }`
      );
    }
    console.error("Unhandled error in updateDocumentContent:", error.message);
    if (!res.statusCode || res.statusCode < 400) res.status(500);
    throw error;
  }
});

/**
 * @desc    List documents (e.g., for current user or a specific project they have access to)
 * @route   GET /api/documents
 * @access  Private
 */
export const listDocuments = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { projectId } = req.query; // Filter by projectId if provided

  if (!userId) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  const whereClause = {
    ownerId: userId, // Default: list documents owned by the current user
  };

  if (projectId) {
    // If projectId is provided, modify whereClause to list documents for that project.
    // Crucially, you MUST add a permission check here to ensure the current user
    // has the right to view documents for this projectId (e.g., they are a member of the project).
    // For now, this example will still filter by ownerId AND projectId if both are present.
    // You'll need to adjust this based on your application's access control logic.
    const projectToFilter = await Project.findByPk(projectId);
    if (!projectToFilter) {
      res.status(404);
      throw new Error(`Project with ID ${projectId} not found.`);
    }
    // Example permission: is user the owner of this project or a member?
    // This is a simplified check.
    // const isProjectOwner = projectToFilter.ownerId === userId;
    // const isProjectMember = await Member.findOne({ where: { projectId, userId, status: 'active' } });
    // if (!isProjectOwner && !isProjectMember) {
    //     res.status(403);
    //     throw new Error(`You are not authorized to view documents for project ID ${projectId}.`);
    // }
    whereClause.projectId = projectId; // Add projectId to the filter
    // If you want to list all documents for a project (and user has access) regardless of who owns them:
    // delete whereClause.ownerId; // And implement proper access check above
  }

  const documents = await Document.findAll({
    where: whereClause,
    attributes: ["id", "title", "projectId", "updatedAt", "ownerId"], // Added ownerId for clarity
    order: [["updatedAt", "DESC"]],
    // include: [{model: User, as: 'owner', attributes: ['id', 'username']}] // Optionally include owner username
  });

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents,
  });
});
