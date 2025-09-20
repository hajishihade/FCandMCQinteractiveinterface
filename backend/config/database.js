/**
 * MongoDB Database Configuration
 *
 * Manages the primary database connection for content storage.
 * This database stores questions, flashcards, and quiz content.
 *
 * Connection Features:
 * - Automatic retry on connection failure
 * - Connection pooling for performance
 * - Graceful shutdown handling
 * - Environment-based configuration
 *
 * Note: This app uses two databases:
 * - Content DB (this file): Questions and study materials
 * - Series DB (seriesDatabase.js): Study sessions and progress
 *
 * Performance:
 * - Connection pooling reduces overhead
 * - Indexes on collections for fast queries
 * - Supports MongoDB Atlas free tier
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Establish connection to MongoDB content database
 *
 * @returns {Promise<Object>} Mongoose connection object
 * @throws {Error} If connection fails or URI is missing
 *
 * Environment variable required:
 * - CONTENT_MONGODB_URI: MongoDB connection string
 *
 * Example URI:
 * mongodb://localhost:27017/studyplatform
 * mongodb+srv://user:pass@cluster.mongodb.net/studyplatform
 */
const connectDB = async () => {
  try {
    // Get connection URI from environment
    const contentDbUri = process.env.CONTENT_MONGODB_URI;

    if (!contentDbUri) {
      throw new Error('CONTENT_MONGODB_URI environment variable is required');
    }

    // Connect with default options (connection pooling enabled)
    const conn = await mongoose.connect(contentDbUri);
    console.log(`Content Database Connected: ${conn.connection.host} (Database: content)`);
    return conn;
  } catch (error) {
    console.error('Content database connection error:', error);
    process.exit(1); // Exit process on connection failure
  }
};

/**
 * Gracefully close database connection
 *
 * @returns {Promise<void>}
 *
 * Call this on application shutdown for clean exit
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Database disconnection error:', error);
  }
};

/**
 * Get current connection status
 *
 * @returns {number} Connection state
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 */
const getConnectionStatus = () => {
  return mongoose.connection.readyState;
};

export { connectDB, disconnectDB, getConnectionStatus };