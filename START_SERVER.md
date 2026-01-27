# How to Start the Backend Server

## Quick Start

**Open a NEW terminal window** (keep your frontend running in the current terminal) and run:

```bash
npm run server
```

## What You Should See

When the server starts successfully, you should see:

```
Connecting to MongoDB...
MongoDB connected successfully
Database: [your database name]
Database connected, starting server...
Server is running on port 3001
Health check: http://localhost:3001/api/health
```

## Troubleshooting

### If you see "MongoDB connection error":
1. Check your `.env` file has the correct `Database` connection string
2. Make sure MongoDB Atlas (if using) has your IP whitelisted
3. Verify the connection string format is correct

### If port 3001 is already in use:
1. Find the process using port 3001:
   ```bash
   netstat -ano | findstr :3001
   ```
2. Kill the process (replace PID with the process ID):
   ```bash
   taskkill /PID [PID] /F
   ```
3. Start the server again

### If the server starts but you still get errors:
- Check the terminal output for specific error messages
- Make sure the database connection string in `.env` is correct
- Verify MongoDB is accessible from your network

## Important

- **Keep the server terminal open** - closing it will stop the server
- The server must be running **before** the frontend tries to fetch data
- You need **TWO terminals**:
  - Terminal 1: `npm run server` (backend)
  - Terminal 2: `npm run dev` (frontend)


