# Setup Instructions

## Backend Server Setup

1. **Start the MongoDB server** (make sure your `.env` file has the correct database connection string)

2. **Start the Express backend server:**
   ```bash
   npm run server
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev:server
   ```

   The server will run on `http://localhost:3001`

## Frontend Setup

1. **Create a `.env` file in the root** (if not already created) with:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

2. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

## Usage

1. Make sure both servers are running:
   - Backend: `http://localhost:3001`
   - Frontend: `http://localhost:5173` (or the port Vite assigns)

2. Navigate to any of the master pages:
   - Menu Master
   - Role Master
   - Menu Access Master
   - User Master
   - User Login History

3. All CRUD operations (Create, Read, Update, Delete) are now functional and connected to MongoDB.

## API Endpoints

- `GET /api/menus` - Get all menus
- `POST /api/menus` - Create menu
- `PUT /api/menus/:id` - Update menu
- `DELETE /api/menus/:id` - Delete menu

- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

- `GET /api/menu-access` - Get all menu accesses
- `POST /api/menu-access` - Create menu access
- `PUT /api/menu-access/:roldId/:menuId` - Update menu access
- `DELETE /api/menu-access/:roldId/:menuId` - Delete menu access

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

- `GET /api/user-login-history` - Get all login histories
- `POST /api/user-login-history` - Create login history
- `PUT /api/user-login-history/:id` - Update login history
- `DELETE /api/user-login-history/:id` - Delete login history


