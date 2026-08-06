/**
 * Global Express error handling middleware.
 * Placed after all route definitions to catch unhandled errors from asyncHandler.
 * 
 * @param {Object} err - Error object passed via next(err)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, _next) => {
  console.error(`[Global Error Handler] Error on ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
