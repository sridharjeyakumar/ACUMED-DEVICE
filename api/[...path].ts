import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from '../server/db/connection';
import menuRoutes from '../server/routes/menuRoutes';
import roleRoutes from '../server/routes/roleRoutes';
import menuAccessRoutes from '../server/routes/menuAccessRoutes';
import userRoutes from '../server/routes/userRoutes';
import userLoginHistoryRoutes from '../server/routes/userLoginHistoryRoutes';

// Create Express app (cached across invocations)
let app: express.Application | null = null;
let dbConnected = false;

async function getApp(): Promise<express.Application> {
  if (app) {
    return app;
  }

  app = express();

  // Middleware
  app.use(cors({
    origin: [
      'https://acumed-devices-production-inventory.vercel.app',
      'http://localhost:8080',
      'http://localhost:5173',
    ],
    credentials: true,
  }));
  app.use(express.json());

  // Connect to database
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  // Routes (remove /api prefix since Vercel already handles it)
  app.use('/menus', menuRoutes);
  app.use('/roles', roleRoutes);
  app.use('/menu-access', menuAccessRoutes);
  app.use('/users', userRoutes);
  app.use('/user-login-history', userLoginHistoryRoutes);

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      message: 'Server is running', 
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
    });
  });

  return app;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = await getApp();
    
    // Get the path from Vercel's route parameter
    // For /api/menus, req.query.path will be ['menus']
    // For /api/health, req.query.path will be ['health']
    const pathArray = (req.query?.path as string[] | string) || [];
    const pathParts = Array.isArray(pathArray) ? pathArray : [pathArray];
    const path = '/' + (pathParts.length > 0 ? pathParts.join('/') : '');
    
    // Preserve query string if exists
    const queryString = req.url?.includes('?') ? req.url.split('?')[1] : '';
    const fullPath = queryString ? `${path}?${queryString}` : path;
    
    // Create Express-compatible request object
    const expressReq = {
      ...req,
      url: fullPath,
      path: path,
      originalUrl: fullPath,
      method: req.method || 'GET',
      headers: req.headers,
      body: req.body,
      query: { ...req.query, path: undefined }, // Remove path from query
      params: {},
    } as any;

    // Handle the request with Express
    return new Promise<void>((resolve, reject) => {
      expressApp(expressReq, res as any, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error: any) {
    console.error('Handler error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

