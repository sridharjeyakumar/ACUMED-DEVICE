import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './db/connection';
import menuRoutes from './routes/menuRoutes';
import roleRoutes from './routes/roleRoutes';
import menuAccessRoutes from './routes/menuAccessRoutes';
import userRoutes from './routes/userRoutes';
import userLoginHistoryRoutes from './routes/userLoginHistoryRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'https://acumed-devices-production-inventory.vercel.app',
  'http://localhost:8080',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/menus', menuRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/menu-access', menuAccessRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-login-history', userLoginHistoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running', 
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

// Error handling middleware (must be last)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Connect to database before starting server
async function startServer() {
  try {
    await connectDB();
    console.log('Database connected, starting server...');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

