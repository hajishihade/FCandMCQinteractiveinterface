/**
 * Pagination Middleware
 *
 * Extracts and standardizes pagination parameters from query string.
 * Provides consistent pagination across all controllers.
 *
 * Features:
 * - Default values for page and limit
 * - Calculates skip value for MongoDB
 * - Validates input parameters
 * - Attaches pagination object to request
 *
 * Usage:
 * router.get('/', paginationMiddleware, controller.getAll);
 */

/**
 * Extract and validate pagination parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 *
 * Adds req.pagination with:
 * - page: Current page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - skip: Number of items to skip for MongoDB
 */
export const paginationMiddleware = (req, res, next) => {
  // Extract query parameters with defaults
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  // Attach pagination object to request
  req.pagination = {
    page,
    limit,
    skip
  };

  next();
};

/**
 * Create pagination response object
 * @param {number} total - Total number of items
 * @param {Object} pagination - Pagination parameters from middleware
 * @returns {Object} Formatted pagination metadata
 *
 * Returns object with:
 * - current: Current page number
 * - pages: Total number of pages
 * - total: Total item count
 * - limit: Items per page
 * - hasNext: Boolean indicating if next page exists
 * - hasPrev: Boolean indicating if previous page exists
 */
export const createPaginationResponse = (total, pagination) => {
  const { page, limit } = pagination;
  const pages = Math.ceil(total / limit);

  return {
    current: page,
    pages,
    total,
    limit,
    hasNext: page < pages,
    hasPrev: page > 1
  };
};

export default paginationMiddleware;