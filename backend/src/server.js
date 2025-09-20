import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const setupMiddleware = () => {
  // Add compression BEFORE other middleware for best performance
  app.use(compression({
    level: 6,                     // Compression level (0-9, 6 is balanced)
    threshold: 1024,              // Only compress responses > 1KB
    filter: (req, res) => {
      // Compress JSON and text responses
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  app.use(helmet());
  app.use(cors());
  app.use(morgan('combined'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};

const registerRoutes = () => {
  app.get('/', (req, res) => {
    res.json({
      message: 'Flashcard Study System API',
      status: 'running',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/flashcards', flashcardRoutes);
  app.use('/api/series', seriesRoutes);
  app.use('/api/mcqs', mcqRoutes);
  app.use('/api/mcq-series', mcqSeriesRoutes);
  app.use('/api/table-quizzes', tableQuizRoutes);
  app.use('/api/table-series', tableSeriesRoutes);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);
};

const startServer = async () => {
  try {
    await connectDB();
    await connectSeriesDB();

    setupMiddleware();
    registerRoutes();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();