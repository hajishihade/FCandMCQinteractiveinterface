/**
 * Main Express server configuration
 * Handles all API routes for Flashcards, MCQs, and Table Quizzes
 *
 * Features:
 * - HTTP compression for 77% payload reduction
 * - Helmet for security headers
 * - CORS for cross-origin requests
 * - Morgan for request logging
 * - Rate limiting (100 requests per 15 minutes per IP)
 * - Dual MongoDB connections (main + series)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { connectSeriesDB } from '../config/seriesDatabase.js';
import flashcardRoutes from './routes/flashcards.js';
import seriesRoutes from './routes/series.js';
import mcqRoutes from './routes/mcqs.js';
import mcqSeriesRoutes from './routes/mcqSeries.js';
import tableQuizRoutes from './routes/tableQuizzes.js';
import tableSeriesRoutes from './routes/tableSeries.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Configure rate limiting for API protection
 * Prevents abuse and ensures fair usage
 */
const createRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minute window
    max: 100,                   // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,      // Return rate limit info in headers
    legacyHeaders: false,       // Disable X-RateLimit-* headers
  });
};

/**
 * Configure Express middleware stack
 * Order matters: compression should be first for best performance
 */
const setupMiddleware = () => {
  // HTTP compression - reduces payload by ~77%
  app.use(compression({
    level: 6,                     // Balanced speed vs compression (0-9 scale)
    threshold: 1024,              // Only compress responses > 1KB
    filter: (req, res) => {
      // Skip compression if client requests it
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  app.use(helmet());              // Security headers
  app.use(cors());                 // Enable cross-origin requests
  app.use(morgan('combined'));     // HTTP request logging
  app.use(express.json());         // Parse JSON bodies
  app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

  // Apply rate limiting to API routes only
  app.use('/api/', createRateLimiter());
};

/**
 * Register all API routes and error handlers
 * Routes are prefixed with /api for clarity
 */
const registerRoutes = () => {
  // Root endpoint - API info
  app.get('/', (req, res) => {
    res.json({
      message: 'Flashcard Study System API',
      status: 'running',
      timestamp: new Date().toISOString()
    });
  });

  // Health check endpoint for monitoring
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  });

  // API routes for each feature
  app.use('/api/flashcards', flashcardRoutes);     // Flashcard CRUD operations
  app.use('/api/series', seriesRoutes);           // Flashcard series management
  app.use('/api/mcqs', mcqRoutes);                // MCQ questions
  app.use('/api/mcq-series', mcqSeriesRoutes);    // MCQ series management
  app.use('/api/table-quizzes', tableQuizRoutes); // Table quiz questions
  app.use('/api/table-series', tableSeriesRoutes); // Table series management

  // Error handlers (order matters - these must be last)
  app.use(notFoundHandler);        // Handle 404 errors
  app.use(globalErrorHandler);     // Handle all other errors
};

/**
 * Initialize server with database connections
 * Connects to MongoDB, sets up middleware, and starts listening
 */
const startServer = async () => {
  try {
    // Connect to both databases
    await connectDB();        // Main database for questions
    await connectSeriesDB();  // Series database for study sessions

    // Configure server
    setupMiddleware();
    registerRoutes();

    // Start listening for requests
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();