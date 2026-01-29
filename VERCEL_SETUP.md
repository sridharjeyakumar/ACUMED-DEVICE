# Vercel Deployment Setup for https://acumed-devices-production-inventory.vercel.app

## Current Status
✅ Frontend deployed on Vercel: https://acumed-devices-production-inventory.vercel.app
❌ Backend not deployed yet (causing 404 errors)

## Step-by-Step Fix

### Step 1: Deploy Backend to Railway (5 minutes)

1. **Go to Railway:**
   - Visit https://railway.app
   - Sign up/login with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `animated-dashboard-delight`

3. **Configure Environment Variables:**
   - In Railway project settings, go to "Variables"
   - Add variable:
     - **Key:** `Database`
     - **Value:** Your MongoDB connection string (from `.env` file)
     - Format: `mongodb+srv://devadharsanmani_db_user:csoDvdFR3MVh3heQ@acumeddevices1.wq4ywgy.mongodb.net/?appName=ACUMEDDEVICES1`

4. **Railway will auto-detect and deploy:**
   - It will run `npm install` and `npm run server`
   - Wait for deployment to complete (2-3 minutes)

5. **Get your Railway URL:**
   - After deployment, Railway will give you a URL like: `https://your-app-name.railway.app`
   - Copy this URL (you'll need it in Step 2)

### Step 2: Update Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Select your project: `acumed-devices-production-inventory`

2. **Add Environment Variable:**
   - Go to: **Settings** → **Environment Variables**
   - Click **Add New**
   - Add:
     - **Key:** `VITE_API_URL`
     - **Value:** `https://your-railway-url.railway.app/api`
       (Replace `your-railway-url` with your actual Railway URL)
     - **Environment:** Select all (Production, Preview, Development)

3. **Save and Redeploy:**
   - Click **Save**
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy**

### Step 3: Update MongoDB Atlas Network Access

1. **Go to MongoDB Atlas:**
   - Visit https://cloud.mongodb.com
   - Login to your account

2. **Network Access:**
   - Go to **Network Access** in left sidebar
   - Click **Add IP Address**
   - Click **Allow Access from Anywhere** (or add `0.0.0.0/0`)
   - Click **Confirm**

### Step 4: Test Your Deployment

1. **Test Backend:**
   - Visit: `https://your-railway-url.railway.app/api/health`
   - Should return: `{"status":"ok","message":"Server is running","db":"connected"}`

2. **Test Frontend:**
   - Visit: https://acumed-devices-production-inventory.vercel.app/menu-master
   - Should load without 404 errors
   - Data should load from MongoDB

## Alternative: Deploy to Render.com

If Railway doesn't work, use Render:

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Name:** `acumed-devices-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
   - **Add Environment Variable:**
     - Key: `Database`
     - Value: Your MongoDB connection string
5. Deploy
6. Get URL (e.g., `https://acumed-devices-api.onrender.com`)
7. Update Vercel `VITE_API_URL` to `https://acumed-devices-api.onrender.com/api`

## Troubleshooting

### Backend shows "disconnected" in health check:
- Check MongoDB Atlas Network Access (Step 3)
- Verify `Database` environment variable in Railway/Render

### Frontend still shows 404:
- Verify `VITE_API_URL` is set in Vercel
- Make sure you redeployed after adding the variable
- Check browser console for actual error messages

### CORS errors:
- Backend CORS is configured to allow your Vercel domain
- If issues persist, check Railway/Render logs

## Quick Checklist

- [ ] Backend deployed to Railway/Render
- [ ] Backend health check works: `/api/health`
- [ ] `VITE_API_URL` set in Vercel environment variables
- [ ] Vercel frontend redeployed
- [ ] MongoDB Atlas allows all IPs (0.0.0.0/0)
- [ ] Test frontend URL works

## Support

If you encounter issues:
1. Check Railway/Render deployment logs
2. Check Vercel deployment logs
3. Test backend health endpoint directly
4. Check browser console for specific errors



