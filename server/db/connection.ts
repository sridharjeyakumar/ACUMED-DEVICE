import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.Database?.replace(/"/g, '') || '';

if (!MONGODB_URI) {
  throw new Error('Please define the Database environment variable inside .env');
}

const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.db?.databaseName);
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message);
    console.error('Connection string (first 50 chars):', MONGODB_URI.substring(0, 50) + '...');
    throw error;
  }
};

export default connectDB;

