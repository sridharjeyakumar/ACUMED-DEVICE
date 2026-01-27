# Next.js Migration Guide

This document outlines the migration from Vite/React to Next.js.

## Completed Steps

1. ✅ Updated `package.json` with Next.js dependencies
2. ✅ Created `next.config.js` and updated `tsconfig.json`
3. ✅ Created all API routes in `app/api/` directory
4. ✅ Created root layout (`app/layout.tsx`) and providers
5. ✅ Created main page (`app/page.tsx`)
6. ✅ Updated Sidebar component to use Next.js Link
7. ✅ Updated API service to work with Next.js
8. ✅ Created `app/globals.css` from `src/index.css`

## Remaining Steps

### 1. Convert All Pages to Next.js

You need to convert all pages from `src/pages/` to Next.js pages in the `app/` directory. For each page:

- Create a directory: `app/[page-name]/`
- Create `page.tsx` inside that directory
- Add `'use client'` directive at the top
- Update imports to use Next.js where needed
- Change `export default` to named export if needed

Example structure:
```
app/
  menu-master/
    page.tsx
  role-master/
    page.tsx
  user-master/
    page.tsx
  ...
```

### 2. Install Dependencies

Run:
```bash
npm install
```

This will install Next.js and remove Vite-specific dependencies.

### 3. Update Environment Variables

Create `.env.local` (or update existing `.env`):
```
Database="your-mongodb-connection-string"
```

### 4. Remove Vite-Specific Files

You can remove:
- `vite.config.ts`
- `index.html`
- `src/main.tsx`
- `src/App.tsx` (replaced by `app/layout.tsx` and `app/page.tsx`)
- `api/[...path].ts` (Vercel serverless function - no longer needed)

### 5. Update Build Scripts

The `package.json` scripts are already updated:
- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Start production server

### 6. Test the Application

1. Start dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. Test all pages and API routes

## API Routes Created

All API routes are in `app/api/`:
- `/api/menus` - Menu Master CRUD
- `/api/roles` - Role Master CRUD
- `/api/menu-access` - Menu Access Master CRUD
- `/api/users` - User Master CRUD
- `/api/user-login-history` - User Login History CRUD
- `/api/health` - Health check

## Key Changes

1. **Routing**: Changed from `react-router-dom` to Next.js file-based routing
2. **API**: Changed from Express routes to Next.js API routes
3. **Components**: Added `'use client'` directive to client components
4. **Links**: Changed from `react-router-dom` Link to Next.js Link
5. **Environment**: Changed from `import.meta.env` to `process.env` (server-side)

## Notes

- All pages need to be converted to Next.js format
- Client components must have `'use client'` directive
- Server components (API routes) don't need this directive
- The Sidebar component has been updated to use Next.js navigation


