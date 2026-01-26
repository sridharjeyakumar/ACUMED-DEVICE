# Deploying Frontend + Backend on Vercel (Same Repo)

## ✅ What's Been Set Up

Your repository is now configured to deploy both frontend and backend on Vercel:

1. **API Serverless Function**: `api/[...path].ts` - Handles all backend API routes
2. **Vercel Configuration**: `vercel.json` - Routes API requests to serverless functions
3. **API Service**: Updated to use relative paths (works on same domain)

## 🚀 Deployment Steps

### Step 1: Add Environment Variable in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project: `acumed-devices-production-inventory`

2. **Add Environment Variable:**
   - Go to: **Settings** → **Environment Variables**
   - Click **Add New**
   - Add:
     - **Key:** `Database`
     - **Value:** `mongodb+srv://devadharsanmani_db_user:csoDvdFR3MVh3heQ@acumeddevices1.wq4ywgy.mongodb.net/?appName=ACUMEDDEVICES1`
     - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

### Step 2: Update MongoDB Atlas

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com
   - Login to your account

2. **Network Access:**
   - Go to **Network Access** in left sidebar
   - Click **Add IP Address**
   - Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
   - Click **Confirm**

### Step 3: Commit and Push Changes

```bash
git add .
git commit -m "Add Vercel serverless functions for backend API"
git push
```

Vercel will automatically detect the push and redeploy.

### Step 4: Verify Deployment

1. **Test Backend API:**
   - Visit: `https://acumed-devices-production-inventory.vercel.app/api/health`
   - Should return: `{"status":"ok","message":"Server is running","db":"connected"}`

2. **Test Frontend:**
   - Visit: `https://acumed-devices-production-inventory.vercel.app/menu-master`
   - Should load without errors
   - Data should appear in the table

## 📁 File Structure

```
your-repo/
├── api/
│   └── [...path].ts          # Vercel serverless function (handles all API routes)
├── server/
│   ├── db/
│   │   └── connection.ts     # MongoDB connection
│   ├── models/               # MongoDB models
│   └── routes/               # Express routes
├── src/
│   └── services/
│       └── api.ts            # Frontend API service (uses /api)
├── vercel.json               # Vercel configuration
└── package.json
```

## 🔧 How It Works

1. **Frontend requests** go to `/api/*` (e.g., `/api/menus`)
2. **Vercel routes** `/api/*` to the serverless function `api/[...path].ts`
3. **Serverless function** uses your Express app to handle the request
4. **Express routes** process the request and return data
5. **Response** goes back to the frontend

## ⚙️ Environment Variables Needed

### In Vercel:
- `Database` - Your MongoDB connection string

That's it! No need for `VITE_API_URL` since API is on the same domain.

## 🐛 Troubleshooting

### "Database connection error"
- Check `Database` environment variable is set in Vercel
- Verify MongoDB Atlas Network Access allows all IPs (0.0.0.0/0)
- Check Vercel deployment logs for specific error

### "404 Not Found" on API routes
- Make sure `api/[...path].ts` file exists
- Check `vercel.json` has correct routing
- Verify deployment completed successfully

### "Function timeout"
- Vercel serverless functions have a timeout (default 10s, max 60s)
- Database queries should be fast
- Check Vercel logs for timeout errors

## 📝 Notes

- **Cold starts**: First request may be slower (serverless function initialization)
- **Database connection**: Cached across requests for better performance
- **CORS**: Configured to allow your Vercel domain
- **Build**: Vercel automatically builds both frontend and serverless functions

## ✅ Checklist

- [ ] `Database` environment variable added in Vercel
- [ ] MongoDB Atlas Network Access updated (0.0.0.0/0)
- [ ] Changes committed and pushed to GitHub
- [ ] Vercel deployment completed successfully
- [ ] Test `/api/health` endpoint
- [ ] Test frontend pages load data

