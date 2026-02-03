import mongoose from 'mongoose';

// Try to load dotenv if available (optional dependency)
try {
  const dotenv = require('dotenv');
  // Load .env file only in development (Vercel uses environment variables from dashboard)
  if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
  }
} catch (e) {
  // dotenv not installed, that's okay - use environment variables from system
  console.log('dotenv not available, using system environment variables');
}

// Get MongoDB URI from environment variable
// Remove quotes if present (sometimes env vars are stored with quotes)
const getMongoURI = (): string => {
  const uri = process.env.Database?.replace(/^["']|["']$/g, '') || '';
  if (!uri) {
    throw new Error('Please define the Database environment variable. In Vercel, set it in Project Settings > Environment Variables.');
  }
  return uri;
};

// Global connection state
let isConnected = false;

const connectDB = async (): Promise<void> => {
  try {
    // Return immediately if already connected
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return;
    }

    // Prevent multiple connection attempts
    if (mongoose.connection.readyState === 2) {
      // Connection in progress, wait for it
      return new Promise((resolve, reject) => {
        mongoose.connection.once('connected', () => {
          isConnected = true;
          resolve();
        });
        mongoose.connection.once('error', reject);
      });
    }

    const MONGODB_URI = getMongoURI();
    
    // Optimize connection with pooling and performance settings
    // REMOVED: bufferMaxEntries and bufferCommands (not supported in Mongoose 8.0.0)
    await mongoose.connect(MONGODB_URI, {
      // Connection pool settings
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2, // Minimum number of connections to maintain
      socketTimeoutMS: 45000, // How long to wait for a socket to be available
      connectTimeoutMS: 30000, // How long to wait for initial connection
      serverSelectionTimeoutMS: 30000, // How long to wait for server selection
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
    });

    isConnected = true;
    
    // Set up connection event handlers for better error handling
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });

    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('MongoDB connected successfully');
      console.log('Database:', mongoose.connection.db?.databaseName);
    }
  } catch (error: any) {
    isConnected = false;
    console.error('MongoDB connection error:', error.message);
    const uri = process.env.Database?.replace(/^["']|["']$/g, '') || 'NOT SET';
    console.error('Connection string (first 50 chars):', uri.substring(0, 50) + '...');
    throw error;
  }
};

// Optimized connection check - faster than checking readyState every time
export const ensureConnection = async (): Promise<void> => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  await connectDB();
};

export default connectDB;

