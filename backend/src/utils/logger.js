/**
 * Simple Logger Utility
 *
 * Lightweight logging utility for development and production.
 * Provides structured logging with levels and timestamps.
 *
 * Features:
 * - Log levels (error, warn, info, debug)
 * - Timestamps on all logs
 * - Environment-aware (debug only in development)
 * - Colorized output in development
 * - JSON format in production
 *
 * Future improvements:
 * - Could integrate with Winston or Pino
 * - Could add file logging
 * - Could add log aggregation service
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

/**
 * Format log message with timestamp
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {*} data - Additional data to log
 * @returns {Object|string} Formatted log entry
 */
const formatLog = (level, message, data) => {
  const timestamp = new Date().toISOString();

  if (!isDevelopment) {
    // Production: JSON format for log aggregation
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(data && { data })
    });
  }

  // Development: Human-readable format
  return { timestamp, level, message, data };
};

/**
 * Logger object with level methods
 */
const logger = {
  /**
   * Log error messages
   * @param {string} message - Error message
   * @param {*} error - Error object or additional data
   */
  error: (message, error = null) => {
    const log = formatLog('ERROR', message, error);
    if (isDevelopment) {
      console.error(`${colors.red}[ERROR]${colors.reset} ${message}`, error || '');
    } else {
      console.error(log);
    }
  },

  /**
   * Log warning messages
   * @param {string} message - Warning message
   * @param {*} data - Additional data
   */
  warn: (message, data = null) => {
    const log = formatLog('WARN', message, data);
    if (isDevelopment) {
      console.warn(`${colors.yellow}[WARN]${colors.reset} ${message}`, data || '');
    } else {
      console.log(log);
    }
  },

  /**
   * Log info messages
   * @param {string} message - Info message
   * @param {*} data - Additional data
   */
  info: (message, data = null) => {
    const log = formatLog('INFO', message, data);
    if (isDevelopment) {
      console.log(`${colors.blue}[INFO]${colors.reset} ${message}`, data || '');
    } else {
      console.log(log);
    }
  },

  /**
   * Log debug messages (only in development)
   * @param {string} message - Debug message
   * @param {*} data - Additional data
   */
  debug: (message, data = null) => {
    if (!isDevelopment) return; // Skip debug logs in production

    console.log(`${colors.gray}[DEBUG]${colors.reset} ${message}`, data || '');
  }
};

export default logger;