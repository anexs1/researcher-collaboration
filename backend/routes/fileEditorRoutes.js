// backend/routes/fileEditorRoutes.js
import express from "express";
import fs from "fs/promises"; // Using fs.promises for async/await
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDITOR_UPLOADS_DIR = path.join(__dirname, "../editor-uploads");

const ensureEditorUploadsDir = async () => {
  try {
    await fs.access(EDITOR_UPLOADS_DIR);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(
        `[File Editor Routes] Directory ${EDITOR_UPLOADS_DIR} does not exist. Creating...`
      );
      await fs.mkdir(EDITOR_UPLOADS_DIR, { recursive: true });
      console.log(
        `[File Editor Routes] Directory ${EDITOR_UPLOADS_DIR} created.`
      );
    } else {
      throw error;
    }
  }
};

router.get("/list", async (req, res, next) => {
  try {
    await ensureEditorUploadsDir();
    const files = await fs.readdir(EDITOR_UPLOADS_DIR);
    const fileDetails = [];
    for (const file of files) {
      const filePath = path.join(EDITOR_UPLOADS_DIR, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        fileDetails.push({ name: file, type: "file" }); // Simple type, frontend can infer more
      }
    }
    res.json(fileDetails);
  } catch (err) {
    console.error("[File Editor Routes] Error listing files:", err);
    next(
      Object.assign(err, {
        status: 500,
        message: "Could not list editor files",
      })
    );
  }
});

router.get("/read/:filename", async (req, res, next) => {
  try {
    await ensureEditorUploadsDir();
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) {
      const err = new Error("Invalid filename. Path traversal detected.");
      err.status = 400;
      return next(err);
    }
    const filePath = path.join(EDITOR_UPLOADS_DIR, safeFilename);
    const data = await fs.readFile(filePath, "utf8");
    res.json({ filename: safeFilename, content: data });
  } catch (err) {
    if (err.code === "ENOENT") {
      const notFoundErr = new Error("Editor file not found");
      notFoundErr.status = 404;
      return next(notFoundErr);
    }
    console.error("[File Editor Routes] Error reading file:", err);
    next(
      Object.assign(err, { status: 500, message: "Could not read editor file" })
    );
  }
});

router.put("/write/:filename", async (req, res, next) => {
  try {
    await ensureEditorUploadsDir();
    const filename = req.params.filename;
    const { content } = req.body;
    if (typeof content === "undefined") {
      const err = new Error("Content is missing in the request body.");
      err.status = 400;
      return next(err);
    }
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) {
      const err = new Error(
        "Invalid filename for writing. Path traversal detected."
      );
      err.status = 400;
      return next(err);
    }
    const filePath = path.join(EDITOR_UPLOADS_DIR, safeFilename);
    await fs.writeFile(filePath, content, "utf8");
    res.json({
      message: `File '${safeFilename}' saved successfully in editor uploads.`,
    });
  } catch (err) {
    console.error("[File Editor Routes] Error writing file:", err);
    next(
      Object.assign(err, {
        status: 500,
        message: "Could not write editor file",
      })
    );
  }
});

export default router;
