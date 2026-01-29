# Quick Fix for Vercel Deployment (Same Repo)

## ✅ What I've Done

I've configured your repo to deploy both frontend AND backend on Vercel using serverless functions. No need for Railway!

## 🚀 3 Simple Steps

### Step 1: Add Environment Variable in Vercel

1. Go to: https://vercel.com/dashboard
2. Select project: `acumed-devices-production-inventory`
3. **Settings** → **Environment Variables**
4. Click **Add New**:
   - **Key:** `Database`
   - **Value:** `mongodb+srv://devadharsanmani_db_user:csoDvdFR3MVh3heQ@acumeddevices1.wq4ywgy.mongodb.net/?appName=ACUMEDDEVICES1`
   - Select all environments (Production, Preview, Development)
5. Click **Save**

### Step 2: Update MongoDB Atlas

1. Go to: https://cloud.mongodb.com
2. **Network Access** → **Add IP Address**
3. Click **Allow Access from Anywhere** (`0.0.0.0/0`)
4. Click **Confirm**

### Step 3: Commit and Push

```bash
git add .
git commit -m "Add Vercel serverless functions"
git push
```

Vercel will automatically redeploy with the backend!

## ✅ Test After Deployment

1. **Backend:** `https://acumed-devices-production-inventory.vercel.app/api/health`
   - Should return: `{"status":"ok","message":"Server is running","db":"connected"}`

2. **Frontend:** `https://acumed-devices-production-inventory.vercel.app/menu-master`
   - Should load without errors
   - Data should appear

## 📁 What Changed

- ✅ Created `api/[...path].ts` - Serverless function that handles all API routes
- ✅ Updated `vercel.json` - Routes `/api/*` to serverless function
- ✅ Updated `src/services/api.ts` - Uses relative paths (works on same domain)
- ✅ No need for `VITE_API_URL` - API is on the same domain!

## 🎉 That's It!

Both frontend and backend will deploy together on Vercel. No separate backend deployment needed!



