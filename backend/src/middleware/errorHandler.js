/**
 * Error Handling Middleware
 *
 * Centralized error handling for the application.
 * Provides consistent error responses and logging.
 *
 * Features:
 * - Async/await error catching
 * - MongoDB-specific error handling
 * - Development vs production error details
 * - Consistent error response format
 * - 404 route handler
 */

/**
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 *
 * Usage: router.get('/', asyncHandler(async (req, res) => {...}))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 *
 * Handles:
 * - ValidationError: Mongoose validation failures
 * - CastError: Invalid MongoDB ObjectId
 * - 11000: Duplicate key errors
 * - Generic errors with stack trace in development
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MongoDB errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errors.join(', '),
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID Format',
      message: 'Invalid resource ID provided',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'Resource already exists',
      timestamp: new Date().toISOString()
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.name || 'Server Error',
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 handler for undefined routes
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 *
 * Returns consistent 404 error response
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
};

export { asyncHandler, globalErrorHandler, notFoundHandler };