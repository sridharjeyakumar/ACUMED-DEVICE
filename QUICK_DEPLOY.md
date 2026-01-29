# Quick Deployment Fix

## The Problem
Your frontend is deployed on Vercel, but the backend is not. API calls are failing with 404 errors.

## Quick Solution (5 minutes)

### Step 1: Deploy Backend to Railway

1. Go to https://railway.app and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variable:
   - Key: `Database`
   - Value: Your MongoDB connection string (from .env file)
5. Railway will auto-deploy
6. Copy your Railway URL (e.g., `https://acumed-devices-api.railway.app`)

### Step 2: Update Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add new variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-railway-url.railway.app/api`
   - Environment: Production, Preview, Development (select all)
4. Save and redeploy

### Step 3: Update MongoDB Atlas

1. Go to MongoDB Atlas dashboard
2. Network Access → Add IP Address
3. Add `0.0.0.0/0` (allows all IPs) OR add Railway's IP ranges
4. Save

### Step 4: Redeploy Frontend

1. In Vercel, go to Deployments
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

## Test

1. Visit: `https://your-railway-url.railway.app/api/health`
   - Should return: `{"status":"ok","message":"Server is running","db":"connected"}`

2. Visit your Vercel URL
   - Should now work without 404 errors

## Alternative: Render.com

If Railway doesn't work, use Render:
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Build Command: `npm install`
   - Start Command: `npm run server`
   - Add environment variable: `Database` = your MongoDB connection string
5. Deploy and get URL
6. Update Vercel `VITE_API_URL` to `https://your-render-url.onrender.com/api`

## Troubleshooting

- **Backend not starting**: Check Railway/Render logs
- **Database connection failed**: Verify MongoDB Atlas IP whitelist
- **CORS errors**: Backend CORS is configured to allow all origins
- **Still 404**: Make sure you set `VITE_API_URL` in Vercel and redeployed



