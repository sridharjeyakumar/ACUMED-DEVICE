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

const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    const MONGODB_URI = getMongoURI();
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.db?.databaseName);
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message);
    const uri = process.env.Database?.replace(/^["']|["']$/g, '') || 'NOT SET';
    console.error('Connection string (first 50 chars):', uri.substring(0, 50) + '...');
    throw error;
  }
};

export default connectDB;

