import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/server/db/connection';

// Ensure DB connection
let dbConnected = false;
async function ensureDbConnection() {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      // Connection failed, but we'll still return status
    }
  }
}

// GET /api/health - Health check endpoint
export async function GET() {
  await ensureDbConnection();
  return NextResponse.json({
    status: 'ok',
    message: 'Server is running',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
}


