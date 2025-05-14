import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// --- TOP LEVEL LOG TO CONFIRM FILE EXECUTION ---
console.log("[UploadMiddleware] Module loaded.");

// Define allowed file types
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
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
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
  "video/quicktime",
];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "..", "uploads", "project_files");
console.log(`[UploadMiddleware] Intended upload directory path: ${uploadDir}`); // LOG 1

// Ensure the destination directory exists
if (!fs.existsSync(uploadDir)) {
  console.log(
    `[UploadMiddleware] Upload directory ${uploadDir} does not exist. Attempting to create.`
  ); // LOG 2
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(
      `[UploadMiddleware] Successfully created upload directory: ${uploadDir}`
    ); // LOG 3
  } catch (err) {
    console.error(
      `[UploadMiddleware] CRITICAL ERROR: Could not create upload directory ${uploadDir}:`,
      err
    ); // LOG 4
  }
} else {
  console.log(
    `[UploadMiddleware] Upload directory ${uploadDir} already exists.`
  ); // LOG 5
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(
      `[UploadMiddleware] multer.diskStorage.destination called for file: ${file.originalname}`
    ); // LOG 6
    if (!fs.existsSync(uploadDir)) {
      const dirError = new Error(
        `[RUNTIME CHECK] Upload destination directory does not exist or is not accessible: ${uploadDir}`
      );
      dirError.code = "UPLOAD_DIR_MISSING_RUNTIME";
      console.error("[UploadMiddleware] " + dirError.message); // LOG 7
      return cb(dirError);
    }
    console.log(
      `[UploadMiddleware] Multer destination confirmed: saving to ${uploadDir}`
    ); // LOG 8
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const newFilename =
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);
    console.log(
      `[UploadMiddleware] multer.diskStorage.filename called. Original: ${file.originalname}, New: ${newFilename}`
    ); // LOG 9
    cb(null, newFilename);
  },
});

const fileFilter = (req, file, cb) => {
  console.log(
    `[UploadMiddleware] fileFilter called for file: ${file.originalname}, MIME type: ${file.mimetype}`
  ); // LOG 10
  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log(
      `[UploadMiddleware] File type ${file.mimetype} ALLOWED for ${file.originalname}.`
    ); // LOG 11
    cb(null, true);
  } else {
    console.warn(
      `[UploadMiddleware] Upload rejected by fileFilter: Invalid mime type ${file.mimetype} for file ${file.originalname}` // LOG 12
    );
    const err = new Error(
      `Invalid file type (${file.mimetype}). Permitted types include common images, documents, and archives.`
    );
    err.code = "INVALID_FILE_TYPE";
    cb(err, false); // Reject file and pass the error to handleMulterError
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: fileFilter,
  // For more detailed multer events, you could tap into busboy events if needed, but this is advanced.
});

// Middleware function to handle single file upload named 'file'
export const handleProjectFileUpload = (req, res, next) => {
  console.log(
    "[UploadMiddleware] handleProjectFileUpload attempting to process 'file' field..."
  ); // LOG 13
  const uploader = upload.single("file"); // 'file' is the field name from FormData

  uploader(req, res, function (err) {
    // This internal callback for uploader(req, res, function(err)) is where Multer's own processing errors for 'upload.single' land.
    // These are different from errors caught by the global 'handleMulterError' if 'upload.single' itself throws synchronously
    // or if errors happen in fileFilter/storage that are passed via `cb(err)`.
    if (err) {
      console.error(
        "[UploadMiddleware] Error directly from upload.single() processing:",
        err.code,
        err.message
      ); // LOG 14
      // We will let handleMulterError catch this by passing it to next.
      // However, ensure `handleMulterError` is indeed the next middleware in the chain in your routes.
      return next(err);
    }
    console.log(
      "[UploadMiddleware] handleProjectFileUpload: Multer's upload.single('file') completed without immediate error. req.file is:",
      req.file ? "Populated" : "NOT Populated"
    ); // LOG 15
    next(); // Proceed to either handleMulterError (if it's next and an error was passed) or the main controller
  });
};

// Error handling middleware specifically for Multer errors and our custom fileFilter errors
export const handleMulterError = (err, req, res, next) => {
  // This middleware will catch errors passed by `cb(err)` from storage/fileFilter,
  // or errors passed by `next(err)` from the `handleProjectFileUpload`'s uploader callback.
  if (err) {
    console.error("[UploadMiddleware] handleMulterError caught an error:"); // LOG 16
    console.error("  Error Code:", err.code);
    console.error("  Error Message:", err.message);
    if (err instanceof multer.MulterError) {
      console.error("  Error Type: MulterError");
    } else {
      console.error("  Error Type: Custom or Other");
    }
    console.error("--- End of handleMulterError details ---");

    let message = "File upload processing error.";
    let statusCode = 400;

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        message = `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
      } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        message =
          "Unexpected file field received. Ensure field name is 'file'.";
      }
      // Add more specific Multer error codes here if needed
    } else if (err.code === "INVALID_FILE_TYPE") {
      message = err.message; // Use the specific message from fileFilter
    } else if (
      err.code === "UPLOAD_DIR_MISSING" ||
      err.code === "UPLOAD_DIR_MISSING_RUNTIME"
    ) {
      message =
        "Server configuration error: Cannot save upload. Destination missing.";
      statusCode = 500;
    } else {
      // Generic error from fs operations or other issues not specifically coded
      message =
        err.message ||
        "An unknown error occurred during file upload preparation.";
      if (!err.code) statusCode = 500; // If it's a generic JS error without a code, assume server-side
    }
    return res
      .status(statusCode)
      .json({ success: false, message, field: err.field || null });
  }
  // If no error, proceed to the next middleware or controller (e.g., your main uploadProjectFile controller)
  console.log(
    "[UploadMiddleware] handleMulterError: No error, calling next()."
  ); // LOG 17
  next();
};
