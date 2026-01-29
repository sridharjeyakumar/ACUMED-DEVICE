# Quick Start Guide

## To Fix "Failed to fetch" Error

### Step 1: Start the Backend Server

Open a terminal and run:
```bash
npm run server
```

You should see:
```
MongoDB connected successfully
Server is running on port 3001
```

### Step 2: Start the Frontend (in a new terminal)

```bash
npm run dev
```

### Step 3: Verify Both Are Running

- Backend: http://localhost:3001 (check http://localhost:3001/api/health)
- Frontend: http://localhost:8080 (or the port shown in terminal)

## Troubleshooting

### If you still see "Failed to fetch":

1. **Check if backend is running:**
   - Open http://localhost:3001/api/health in your browser
   - Should return: `{"status":"ok","message":"Server is running"}`

2. **Check MongoDB connection:**
   - Make sure your `.env` file has the correct database connection string
   - The server should show "MongoDB connected successfully" when starting

3. **Check browser console:**
   - Open browser DevTools (F12)
   - Look for CORS errors or network errors in the Console tab

4. **Restart both servers:**
   - Stop both servers (Ctrl+C)
   - Start backend first: `npm run server`
   - Then start frontend: `npm run dev`

## Common Issues

- **Port 3001 already in use:** Change PORT in server/index.ts or kill the process using that port
- **MongoDB connection failed:** Check your .env file has the correct Database connection string
- **CORS errors:** The proxy in vite.config.ts should handle this, but make sure both servers are running



