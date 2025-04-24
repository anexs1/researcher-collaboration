// Middleware for 404 Not Found errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass the error to the global error handler
};

// Global error handler middleware
// Needs to have 4 parameters (err, req, res, next) to be recognized as an error handler by Express
const errorHandler = (err, req, res, next) => {
  // Determine status code: Use the one set on the error/response, or default to 500
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  // Use err.status or err.statusCode if available
  statusCode = err.status || err.statusCode || statusCode;

  // Determine message
  let message = err.message || "Internal Server Error";

  // Special handling for specific error types if needed (e.g., CastError for MongoDB/Mongoose)
  // if (err.name === 'CastError' && err.kind === 'ObjectId') {
  //     statusCode = 404;
  //     message = 'Resource not found';
  // }

  console.error("💥 Error Handler Caught:");
  console.error("Status Code:", statusCode);
  console.error("Message:", message);
  if (process.env.NODE_ENV === "development") {
    console.error("Stack:", err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    // Include stack trace only in development environment for security
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

// Export the functions
export { notFound, errorHandler };
