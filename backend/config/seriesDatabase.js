import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Create separate connection for series database
const seriesConnection = mongoose.createConnection();

const connectSeriesDB = async () => {
  try {
    // Connect to series database
    const seriesDbUri = process.env.SERIES_MONGODB_URI;

    if (!seriesDbUri) {
      throw new Error('SERIES_MONGODB_URI environment variable is required');
    }

    await seriesConnection.openUri(seriesDbUri, {
      maxPoolSize: 10,          // Maximum number of connections in the pool
      minPoolSize: 2,           // Minimum number of connections to maintain
      socketTimeoutMS: 45000,   // How long to wait for socket operations
      serverSelectionTimeoutMS: 5000,  // How long to wait for server selection
    });
    console.log(`Series Database Connected: ${seriesConnection.host} (Database: series)`);
    return seriesConnection;
  } catch (error) {
    console.error('Series database connection error:', error);
    process.exit(1);
  }
};

const disconnectSeriesDB = async () => {
  try {
    await seriesConnection.close();
    console.log('Series Database Disconnected');
  } catch (error) {
    console.error('Series database disconnection error:', error);
  }
};

const getSeriesConnectionStatus = () => {
  return seriesConnection.readyState;
};

export { seriesConnection, connectSeriesDB, disconnectSeriesDB, getSeriesConnectionStatus };