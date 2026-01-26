# Deployment Guide

## Problem
You're getting 404 errors because the backend server is not deployed. Vercel only hosts the frontend.

## Solution: Deploy Backend Separately

You have two options:

### Option 1: Deploy Backend to Railway (Recommended - Free tier available)

1. **Create Railway account:**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Railway:**
   - Add environment variable: `Database` with your MongoDB connection string
   - Railway will auto-detect Node.js and run `npm run server`

4. **Get your backend URL:**
   - Railway will give you a URL like: `https://your-app.railway.app`
   - Your API will be at: `https://your-app.railway.app/api`

5. **Update Vercel environment variables:**
   - Go to your Vercel project settings
   - Add environment variable: `VITE_API_URL` = `https://your-app.railway.app/api`
   - Redeploy your frontend

### Option 2: Deploy Backend to Render (Free tier available)

1. **Create Render account:**
   - Go to https://render.com
   - Sign up

2. **Create new Web Service:**
   - Connect your GitHub repository
   - Build command: `npm install`
   - Start command: `npm run server`
   - Add environment variable: `Database` with your MongoDB connection string

3. **Get your backend URL:**
   - Render will give you a URL like: `https://your-app.onrender.com`
   - Your API will be at: `https://your-app.onrender.com/api`

4. **Update Vercel:**
   - Add environment variable: `VITE_API_URL` = `https://your-app.onrender.com/api`
   - Redeploy

### Option 3: Use Vercel Serverless Functions (Advanced)

This requires converting your Express server to serverless functions. More complex but keeps everything on Vercel.

## Quick Fix for Now

If you want to test quickly, update `src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  'https://your-deployed-backend-url.railway.app/api';
```

Replace `your-deployed-backend-url.railway.app` with your actual backend URL.

## Environment Variables Needed

### In Railway/Render (Backend):
- `Database` - Your MongoDB connection string
- `PORT` - (Optional, defaults to 3001)

### In Vercel (Frontend):
- `VITE_API_URL` - Your deployed backend URL (e.g., `https://your-app.railway.app/api`)

## Testing

After deployment:
1. Test backend: `https://your-backend-url.railway.app/api/health`
2. Should return: `{"status":"ok","message":"Server is running","db":"connected"}`
3. Test frontend: Your Vercel URL should now work

## Important Notes

- **CORS**: Make sure your backend allows requests from your Vercel domain
- **MongoDB Atlas**: Whitelist Railway/Render IPs (or use 0.0.0.0/0 for all IPs)
- **Environment Variables**: Never commit `.env` file, use platform environment variables

