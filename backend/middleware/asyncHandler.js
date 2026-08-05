/**
 * Higher-order function to wrap asynchronous Express route handlers.
 * Catches any thrown errors or rejected promises and passes them to next(err).
 * 
 * @param {Function} fn - Async route handler function (req, res, next)
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
