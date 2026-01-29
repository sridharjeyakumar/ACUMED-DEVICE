# Troubleshooting HTTP 500 Error

## Common Causes and Solutions

### 1. Database Connection Issue

**Check if MongoDB connection string is correct:**
- Open `.env` file
- Verify `Database` variable has the correct MongoDB connection string
- Make sure there are no extra quotes or spaces

**Test connection:**
```bash
npm run seed
```
If this works, your connection string is correct.

### 2. Server Not Waiting for Database

The server now waits for database connection before starting. Check the server logs:
- You should see: "MongoDB connected successfully"
- Then: "Database connected, starting server..."
- Then: "Server is running on port 3001"

### 3. Check Server Logs

When you see a 500 error, check the terminal where the server is running. You should see:
- The actual error message
- Which route failed
- Database connection status

### 4. Restart the Server

1. Stop the server (Ctrl+C)
2. Make sure `.env` file has correct `Database` variable
3. Start again: `npm run server`

### 5. Verify Database Connection

Test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Server is running",
  "db": "connected"
}
```

If `db` is "disconnected", the database connection failed.

### 6. Check MongoDB Atlas (if using)

- Verify your IP is whitelisted
- Check if the database user has correct permissions
- Ensure the connection string is correct

### 7. Common Error Messages

- **"Failed to fetch menus"** - Database query failed, check server logs
- **"Cannot connect to server"** - Backend server not running
- **"MongoDB connection error"** - Check `.env` file and connection string



