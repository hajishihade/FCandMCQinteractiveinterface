import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Connect to content database
    const contentDbUri = process.env.CONTENT_MONGODB_URI;

    if (!contentDbUri) {
      throw new Error('CONTENT_MONGODB_URI environment variable is required');
    }

    const conn = await mongoose.connect(contentDbUri);
    console.log(`Content Database Connected: ${conn.connection.host} (Database: content)`);
    return conn;
  } catch (error) {
    console.error('Content database connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Database disconnection error:', error);
  }
};

const getConnectionStatus = () => {
  return mongoose.connection.readyState;
};

export { connectDB, disconnectDB, getConnectionStatus };