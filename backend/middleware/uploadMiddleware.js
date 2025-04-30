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
  "application/pdf",
  "text/plain",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/csv", // .csv
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define storage location (e.g., public/uploads/project_files relative to backend root)
// Ensure this directory exists or create it
const uploadDir = path.join(
  __dirname,
  "..",
  "public",
  "uploads",
  "project_files"
);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created upload directory: ${uploadDir}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save files to the defined directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename: fieldname-timestamp-originalfilename
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
      `Upload rejected: Invalid mime type ${file.mimetype} for file ${file.originalname}`
    );
    // Reject file but don't throw an error that crashes the server immediately
    cb(
      new Error(
        "Invalid file type. Allowed types: images, PDF, documents, text, spreadsheets, CSV."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter,
});

// Middleware function to handle single file upload named 'file'
// This expects the field name in FormData to be 'file'
export const handleProjectFileUpload = upload.single("file");

// Error handling middleware specifically for Multer errors
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    console.error("Multer Error:", err.code, err.message);
    let message = "File upload error.";
    if (err.code === "LIMIT_FILE_SIZE") {
      message = `File too large. Maximum size is ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB.`;
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field received.";
    }
    return res.status(400).json({ success: false, message });
  } else if (err) {
    // An unknown error occurred when uploading (e.g., fileFilter rejection).
    console.error("Non-Multer Upload Error:", err.message);
    // Use the message from the fileFilter error if available
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid file provided.",
    });
  }
  // Everything went fine, pass to next middleware/controller
  next();
};
