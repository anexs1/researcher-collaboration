// backend/middleware/uploadMiddleware.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Define allowed file types (adjust as needed)
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "text/csv",
  "text/xml",
  "text/html",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/gzip",
  "application/x-tar",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/webm",
  "audio/m4a",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // .mov
  // Add more specific mime types if needed for your application
];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // This will be path/to/your/project/backend/middleware/

// --- CORRECTED UPLOAD DIRECTORY ---
// Define storage location to align with server.js static serving
// server.js serves from `backend/uploads/` for URL `/uploads`
// So we save into a subfolder `project_files` within `backend/uploads/`
const uploadDir = path.join(
  __dirname, // backend/middleware/
  "..", // up to backend/
  "uploads", // into backend/uploads/  <--- Base for static serving
  "project_files" // into backend/uploads/project_files/  <--- Subfolder for these specific uploads
);

// Ensure the destination directory exists
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[UploadMiddleware] Created upload directory: ${uploadDir}`);
  } catch (err) {
    console.error(
      `[UploadMiddleware] CRITICAL ERROR: Could not create upload directory ${uploadDir}:`,
      err
    );
    // If this fails, uploads will not work. Consider throwing an error to halt server startup
    // or implementing a more robust retry/fallback.
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Before calling cb, ensure uploadDir actually exists (could have failed creation)
    if (!fs.existsSync(uploadDir)) {
      const dirError = new Error(
        `Upload destination directory does not exist or is not accessible: ${uploadDir}`
      );
      dirError.code = "UPLOAD_DIR_MISSING";
      console.error("[UploadMiddleware] " + dirError.message);
      return cb(dirError); // Pass error to multer
    }
    // console.log(`[UploadMiddleware] Multer destination: saving to ${uploadDir}`);
    cb(null, uploadDir); // Save files to the defined directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    console.warn(
      `[UploadMiddleware] Upload rejected: Invalid mime type ${file.mimetype} for file ${file.originalname}`
    );
    const err = new Error(
      `Invalid file type (${file.mimetype}). Not permitted for upload.`
    );
    err.code = "INVALID_FILE_TYPE"; // Custom code for more specific error handling
    cb(err, false); // Reject file and pass the error
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: fileFilter,
});

export const handleProjectFileUpload = upload.single("file"); // Expects field name 'file' in FormData

export const handleMulterError = (err, req, res, next) => {
  if (err) {
    // Catches errors from multer (MulterError) AND from fileFilter/destination callback
    console.error(
      "[UploadMiddleware] Error during file processing stage:",
      err.code,
      err.message
    );
    let message = "File upload processing error.";
    let statusCode = 400; // Default to Bad Request

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        message = `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
      } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        message =
          "Unexpected file field received. Ensure field name is 'file'.";
      }
      // Add more Multer error codes as needed
    } else if (err.code === "INVALID_FILE_TYPE") {
      message = err.message; // Use the specific message from fileFilter
    } else if (err.code === "UPLOAD_DIR_MISSING") {
      message = "Server configuration error: Cannot save upload.";
      statusCode = 500; // Server-side issue
    } else {
      // Generic error from fs operations or other issues
      message =
        err.message ||
        "An unknown error occurred during file upload preparation.";
      statusCode = 500;
    }
    return res
      .status(statusCode)
      .json({ success: false, message, field: err.field || null });
  }
  // If no error, proceed to the next middleware or controller
  next();
};
