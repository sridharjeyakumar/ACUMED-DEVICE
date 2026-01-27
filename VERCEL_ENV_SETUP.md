# How to Fix "VITE_API_URL environment variable is not set" Error

## Quick Fix (5 minutes)

### Step 1: Deploy Backend to Railway

1. **Go to Railway:**
   - Visit: https://railway.app
   - Sign up/login with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add Environment Variable:**
   - In Railway project, go to "Variables" tab
   - Click "New Variable"
   - **Key:** `Database`
   - **Value:** `mongodb+srv://devadharsanmani_db_user:csoDvdFR3MVh3heQ@acumeddevices1.wq4ywgy.mongodb.net/?appName=ACUMEDDEVICES1`
   - Click "Add"

4. **Wait for Deployment:**
   - Railway will automatically deploy
   - Wait 2-3 minutes for deployment to complete
   - Copy your Railway URL (e.g., `https://acumed-api.railway.app`)

### Step 2: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your project: `acumed-devices-production-inventory`

2. **Navigate to Environment Variables:**
   - Click **Settings** (top menu)
   - Click **Environment Variables** (left sidebar)

3. **Add New Variable:**
   - Click **Add New** button
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-railway-url.railway.app/api`
     - Replace `your-railway-url` with your actual Railway URL from Step 1
   - **Environment:** Select all three:
     - ☑ Production
     - ☑ Preview  
     - ☑ Development
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on your latest deployment
   - Click **Redeploy**
   - Wait for deployment to complete

### Step 3: Update MongoDB Atlas

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com
   - Login to your account

2. **Network Access:**
   - Click **Network Access** in left sidebar
   - Click **Add IP Address**
   - Click **Allow Access from Anywhere** (adds 0.0.0.0/0)
   - Click **Confirm**

### Step 4: Verify

1. **Test Backend:**
   - Visit: `https://your-railway-url.railway.app/api/health`
   - Should return: `{"status":"ok","message":"Server is running","db":"connected"}`

2. **Test Frontend:**
   - Visit: https://acumed-devices-production-inventory.vercel.app/menu-master
   - Should now load without errors
   - Data should appear in the table

## Visual Guide

### Vercel Environment Variables Screen:
```
Settings → Environment Variables → Add New

Key:   VITE_API_URL
Value: https://your-railway-url.railway.app/api
☑ Production
☑ Preview
☑ Development

[Save]
```

### After Adding Variable:
1. Go to Deployments tab
2. Click ⋯ on latest deployment
3. Click "Redeploy"
4. Wait for build to complete

## Common Issues

### "Backend URL not working"
- Check Railway deployment logs
- Verify `Database` variable is set correctly in Railway
- Test backend health endpoint directly

### "Still showing error after redeploy"
- Make sure you selected all environments (Production, Preview, Development)
- Wait for deployment to fully complete
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache

### "CORS errors"
- Backend CORS is configured to allow your Vercel domain
- Check Railway logs for CORS-related errors

## Alternative: Render.com

If Railway doesn't work:

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Build Command: `npm install`
   - Start Command: `npm run server`
   - Add Environment Variable: `Database` = your MongoDB connection string
5. Deploy and get URL
6. Use that URL in Vercel `VITE_API_URL`

## Need Help?

Check the deployment logs:
- **Vercel:** Project → Deployments → Click deployment → View logs
- **Railway:** Project → Deployments → Click deployment → View logs


