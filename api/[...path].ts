import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import connectDB from '../server/db/connection';
import MenuMaster from '../server/models/MenuMaster';
import RoleMaster from '../server/models/RoleMaster';
import MenuAccessMaster from '../server/models/MenuAccessMaster';
import UserMaster from '../server/models/UserMaster';
import UserLoginHistory from '../server/models/UserLoginHistory';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Cache database connection
let dbConnected = false;

const logPath = path.join(process.cwd(), '.cursor', 'debug.log');

function logBackend(location: string, message: string, data: any) {
  const logEntry = {location,message,data,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H5'};
  const logStr = JSON.stringify(logEntry);
  console.error('[DEBUG]', logStr);
  try {
    if (!fs.existsSync(path.dirname(logPath))) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }
    fs.appendFileSync(logPath, logStr + '\n');
  } catch(e: any) {
    console.error('[DEBUG] Log write failed:', e.message);
  }
  try {
    fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:logStr}).catch(()=>{});
  } catch(e){}
}

async function ensureDbConnection() {
  if (!dbConnected) {
    try {
      logBackend('api/[...path].ts:16', 'ensureDbConnection - attempting connection', {readyState: mongoose.connection.readyState});
      await connectDB();
      dbConnected = true;
      logBackend('api/[...path].ts:20', 'ensureDbConnection - connection successful', {readyState: mongoose.connection.readyState});
    } catch (error: any) {
      logBackend('api/[...path].ts:23', 'ensureDbConnection - connection failed', {error: error.message, stack: error.stack});
      console.error('Database connection error:', error);
      dbConnected = false;
      throw error;
    }
  } else {
    // Verify connection is still alive
    if (mongoose.connection.readyState !== 1) {
      logBackend('api/[...path].ts:30', 'ensureDbConnection - connection lost, reconnecting', {readyState: mongoose.connection.readyState});
      dbConnected = false;
      await ensureDbConnection();
    }
  }
}

// Set CORS headers
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Helper to parse path
function parsePath(req: VercelRequest): { resource: string; id?: string; subResource?: string } {
  const pathArray = (req.query?.path as string[] | string) || [];
  const parts = Array.isArray(pathArray) ? pathArray : [pathArray];
  
  if (parts.length === 0) {
    return { resource: '' };
  }
  
  const resource = parts[0];
  const id = parts[1];
  const subResource = parts[2];
  
  return { resource, id, subResource };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Immediate console log that will always work
  console.error('[API HANDLER] Called', { method: req.method, url: req.url });
  try {
    // #region agent log
    logBackend('api/[...path].ts:70', 'Handler entry', {method:req.method,url:req.url,hasBody:!!req.body,query:req.query,bodyType:typeof req.body});
    // #endregion
  
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      setCorsHeaders(res);
      return res.status(200).end();
    }

    // Set CORS headers for all responses
    setCorsHeaders(res);

    // Parse request body if it's a string (Vercel sometimes sends body as string)
    if (typeof req.body === 'string' && req.body) {
      try {
        req.body = JSON.parse(req.body);
        // #region agent log
        logBackend('api/[...path].ts:86', 'Body parsed from string', {body:req.body});
        // #endregion
      } catch (e) {
        // #region agent log
        logBackend('api/[...path].ts:90', 'Body parse failed', {error:(e as Error).message,bodyString:req.body});
        // #endregion
      }
    }

    // #region agent log
    logBackend('api/[...path].ts:100', 'Before DB connection', {});
    // #endregion
    // Ensure database connection
    await ensureDbConnection();
    // #region agent log
    logBackend('api/[...path].ts:72', 'After DB connection', {dbConnected});
    // #endregion
    
    // Parse the path
    const { resource, id, subResource } = parsePath(req);
    const method = req.method || 'GET';
    // #region agent log
    logBackend('api/[...path].ts:83', 'Path parsed', {resource,id,subResource,method,url:req.url,query:req.query});
    // #endregion
    
    // Log for debugging (remove in production if needed)
    console.log(`[API] ${method} ${req.url} - Resource: ${resource}, ID: ${id}, SubResource: ${subResource}`);

    // Health check
    if (resource === 'health' || (resource === '' && req.url?.includes('health'))) {
      return res.json({
        status: 'ok',
        message: 'Server is running',
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      });
    }

    // Menu Master routes
    if (resource === 'menus') {
      console.error('[API] Menu routes entered', { method, id, resource, hasBody: !!req.body });
      // #region agent log
      logBackend('api/[...path].ts:129', 'Menu routes entered', {method,id,hasBody:!!req.body,body:req.body});
      // #endregion
      if (method === 'GET' && !id) {
        try {
          logBackend('api/[...path].ts:136', 'GET menus - before query', {dbState: mongoose.connection.readyState});
          // Check if database is connected
          if (mongoose.connection.readyState !== 1) {
            logBackend('api/[...path].ts:139', 'GET menus - DB not connected', {readyState: mongoose.connection.readyState});
            return res.status(500).json({ error: 'Database not connected', readyState: mongoose.connection.readyState });
          }
          const menus = await MenuMaster.find().sort({ menu_id: 1 }).lean();
          // #region agent log
          logBackend('api/[...path].ts:154', 'GET menus - query success', {count: menus.length, firstMenu: menus.length > 0 ? menus[0] : null, allMenus: menus});
          // #endregion
          return res.json(menus);
        } catch (error: any) {
          logBackend('api/[...path].ts:146', 'GET menus - error', {error: error.message, code: error.code, name: error.name, stack: error.stack});
          console.error('[API] GET menus error:', error);
          return res.status(500).json({ 
            error: error.message || 'Failed to fetch menus',
            ...(process.env.NODE_ENV === 'development' && { details: error.stack })
          });
        }
      }
      if (method === 'GET' && id) {
        try {
          const menu = await MenuMaster.findOne({ menu_id: id });
          if (!menu) return res.status(404).json({ error: 'Menu not found' });
          return res.json(menu);
        } catch (error: any) {
          console.error('[API] GET menu error:', error);
          return res.status(500).json({ error: error.message || 'Failed to fetch menu' });
        }
      }
      if (method === 'POST') {
        // #region agent log
        logBackend('api/[...path].ts:119', 'POST handler entered', {body:req.body,bodyType:typeof req.body});
        // #endregion
        try {
          const { menu_id, menu_desc, active } = req.body;
          // #region agent log
          logBackend('api/[...path].ts:125', 'POST body parsed', {menu_id,menu_desc,active});
          // #endregion
          const menu = new MenuMaster({ 
            menu_id, 
            menu_desc, 
            active: active !== false,
            last_modified_user_id: req.body.last_modified_user_id || 'ADMIN',
            last_modified_date_time: new Date(),
          });
          // #region agent log
          logBackend('api/[...path].ts:132', 'Before menu.save()', {menu_id});
          // #endregion
          await menu.save();
          // #region agent log
          logBackend('api/[...path].ts:138', 'After menu.save() success', {menu_id});
          // #endregion
          return res.status(201).json(menu);
        } catch (error: any) {
          // #region agent log
          logBackend('api/[...path].ts:145', 'POST error caught', {error:error.message,code:error.code,name:error.name,stack:error.stack});
          // #endregion
          console.error('[API] Menu create error:', error);
          if (error.code === 11000) {
            return res.status(400).json({ error: 'Menu ID already exists' });
          }
          if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation failed', details: error.message });
          }
          throw error;
        }
      }
      if (method === 'PUT' && id) {
        console.error('[API] PUT handler reached', { id, hasBody: !!req.body, body: req.body, method, resource });
        // #region agent log
        logBackend('api/[...path].ts:177', 'PUT handler entered', {id,body:req.body});
        // #endregion
        try {
          console.error('[API] PUT handler - inside try block', { id });
          const body = req.body || {};
          const { menu_desc, active } = body;
          // #region agent log
          logBackend('api/[...path].ts:167', 'PUT body parsed', {id,menu_desc,active});
          // #endregion
          
          const updateData: any = {};
          if (menu_desc !== undefined && menu_desc !== null) updateData.menu_desc = menu_desc;
          if (active !== undefined) updateData.active = active !== false;
          updateData.last_modified_user_id = req.body.last_modified_user_id || 'ADMIN';
          updateData.last_modified_date_time = new Date();
          
          if (Object.keys(updateData).length === 0) {
            // #region agent log
            logBackend('api/[...path].ts:180', 'PUT validation failed - no update data', {id});
            // #endregion
            return res.status(400).json({ error: 'At least one field must be provided for update' });
          }
          
          // #region agent log
          logBackend('api/[...path].ts:189', 'Before findOneAndUpdate', {id,updateData});
          // #endregion
          const menu = await MenuMaster.findOneAndUpdate(
            { menu_id: id },
            updateData,
            { new: true, runValidators: true }
          );
          // #region agent log
          logBackend('api/[...path].ts:249', 'After findOneAndUpdate', {id,menuFound:!!menu,menu:menu?menu.toObject():null,updateData});
          // #endregion
          if (!menu) return res.status(404).json({ error: 'Menu not found' });
          return res.json(menu);
        } catch (error: any) {
          // #region agent log
          logBackend('api/[...path].ts:206', 'PUT error caught', {id,error:error.message,code:error.code,name:error.name,stack:error.stack});
          // #endregion
          console.error('[API] Menu update error:', error);
          if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation failed', details: error.message });
          }
          return res.status(400).json({ 
            error: 'Failed to update menu', 
            details: error.message 
          });
        }
      }
      if (method === 'DELETE' && id) {
        console.error('[API] DELETE handler reached', { id, method, resource });
        // #region agent log
        logBackend('api/[...path].ts:226', 'DELETE handler entered', {id});
        // #endregion
        try {
          console.error('[API] DELETE handler - inside try block', { id });
          // #region agent log
          logBackend('api/[...path].ts:219', 'Before findOneAndDelete', {id});
          // #endregion
          const menu = await MenuMaster.findOneAndDelete({ menu_id: id });
          // #region agent log
          logBackend('api/[...path].ts:277', 'After findOneAndDelete', {id,menuFound:!!menu,menu:menu?menu.toObject():null});
          // #endregion
          if (!menu) return res.status(404).json({ error: 'Menu not found' });
          return res.json({ message: 'Menu deleted successfully' });
        } catch (error: any) {
          // #region agent log
          logBackend('api/[...path].ts:225', 'DELETE error caught', {id,error:error.message,code:error.code,name:error.name,stack:error.stack});
          // #endregion
          console.error('[API] Menu delete error:', error);
          return res.status(400).json({ 
            error: 'Failed to delete menu', 
            details: error.message 
          });
        }
      }
    }

    // Role Master routes
    if (resource === 'roles') {
      if (method === 'GET' && !id) {
        const roles = await RoleMaster.find().sort({ roll_id: 1 });
        return res.json(roles);
      }
      if (method === 'GET' && id) {
        const role = await RoleMaster.findOne({ roll_id: id });
        if (!role) return res.status(404).json({ error: 'Role not found' });
        return res.json(role);
      }
      if (method === 'POST') {
        const { roll_id, roll_description, remarks, active } = req.body;
        const role = new RoleMaster({ 
          roll_id, 
          roll_description, 
          remarks, 
          active: active !== false,
          last_modified_user_id: req.body.last_modified_user_id || 'ADMIN',
          last_modified_date_time: new Date(),
        });
        await role.save();
        return res.status(201).json(role);
      }
      if (method === 'PUT' && id) {
        const { roll_description, remarks, active } = req.body;
        const role = await RoleMaster.findOneAndUpdate(
          { roll_id: id },
          { 
            roll_description, 
            remarks, 
            active: active !== false,
            last_modified_user_id: req.body.last_modified_user_id || 'ADMIN',
            last_modified_date_time: new Date(),
          },
          { new: true, runValidators: true }
        );
        if (!role) return res.status(404).json({ error: 'Role not found' });
        return res.json(role);
      }
      if (method === 'DELETE' && id) {
        const role = await RoleMaster.findOneAndDelete({ roll_id: id });
        if (!role) return res.status(404).json({ error: 'Role not found' });
        return res.json({ message: 'Role deleted successfully' });
      }
    }

    // Menu Access Master routes
    if (resource === 'menu-access') {
      if (method === 'GET' && !id) {
        const accesses = await MenuAccessMaster.find().sort({ rold_id: 1, menu_id: 1 });
        return res.json(accesses);
      }
      if (method === 'GET' && id && subResource) {
        // GET /api/menu-access/:roldId/:menuId
        const access = await MenuAccessMaster.findOne({ rold_id: id, menu_id: subResource });
        if (!access) return res.status(404).json({ error: 'Menu access not found' });
        return res.json(access);
      }
      if (method === 'POST') {
        const { rold_id, menu_id, access, can_add, can_edit, can_view, can_cancel } = req.body;
        const menuAccess = new MenuAccessMaster({
          rold_id,
          menu_id,
          access: access !== false,
          can_add: can_add !== false,
          can_edit: can_edit !== false,
          can_view: can_view !== false,
          can_cancel: can_cancel !== false,
          last_modified_user_id: req.body.last_modified_user_id || 'ADMIN',
          last_modified_date_time: new Date(),
        });
        try {
          await menuAccess.save();
          return res.status(201).json(menuAccess);
        } catch (error: any) {
          if (error.code === 11000) {
            return res.status(400).json({ error: 'Menu access already exists for this role and menu' });
          }
          throw error;
        }
      }
      if (method === 'PUT' && id && subResource) {
        // PUT /api/menu-access/:roldId/:menuId
        try {
          const body = req.body || {};
          const { access, can_add, can_edit, can_view, can_cancel } = body;
          
          const menuAccess = await MenuAccessMaster.findOneAndUpdate(
            { rold_id: id, menu_id: subResource },
            {
              rold_id: id,
              menu_id: subResource,
              access: access !== false,
              can_add: can_add !== false,
              can_edit: can_edit !== false,
              can_view: can_view !== false,
              can_cancel: can_cancel !== false,
              last_modified_user_id: req.body.last_modified_user_id || 'ADMIN',
              last_modified_date_time: new Date(),
            },
            { new: true, runValidators: true, upsert: true }
          );
          return res.json(menuAccess);
        } catch (error: any) {
          console.error('[API] Menu access update error:', error);
          if (error.code === 11000) {
            return res.status(400).json({ error: 'Menu access already exists for this role and menu' });
          }
          return res.status(400).json({ 
            error: 'Failed to update menu access', 
            details: error.message 
          });
        }
      }
      if (method === 'DELETE' && id && subResource) {
        // DELETE /api/menu-access/:roldId/:menuId
        const menuAccess = await MenuAccessMaster.findOneAndDelete({ rold_id: id, menu_id: subResource });
        if (!menuAccess) return res.status(404).json({ error: 'Menu access not found' });
        return res.json({ message: 'Menu access deleted successfully' });
      }
    }

    // User Master routes
    if (resource === 'users') {
      if (method === 'GET' && !id) {
        const users = await UserMaster.find().select('-hash_password').sort({ user_id: 1 });
        return res.json(users);
      }
      if (method === 'GET' && id) {
        const user = await UserMaster.findOne({ user_id: id }).select('-hash_password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json(user);
      }
      if (method === 'POST') {
        const { user_id, employee_id, password, role_id, N_password_expiry_days, active } = req.body;
        const hash_password = await bcrypt.hash(password || 'defaultPassword123', 10);
        const passwordExpiryDate = new Date();
        passwordExpiryDate.setDate(passwordExpiryDate.getDate() + (N_password_expiry_days || 90));
        const user = new UserMaster({
          user_id,
          employee_id,
          hash_password,
          role_id: role_id || req.body.roll_id,
          Date_password_changed_date: new Date(),
          Date_password_expiry_date: passwordExpiryDate,
          N_password_expiry_days: N_password_expiry_days || 90,
          active: active !== false,
          last_modified_user_id: req.body.last_modified_user_id || 'ADMIN',
          last_modified_date_time: new Date(),
        });
        const savedUser = await user.save();
        const userResponse = savedUser.toObject() as any;
        delete userResponse.hash_password;
        return res.status(201).json(userResponse);
      }
      if (method === 'PUT' && id) {
        const { employee_id, password, role_id, N_password_expiry_days, active } = req.body;
        const updateData: any = { employee_id, active: active !== false };
        if (role_id !== undefined) updateData.role_id = role_id;
        updateData.last_modified_user_id = req.body.last_modified_user_id || 'ADMIN';
        updateData.last_modified_date_time = new Date();
        if (password) {
          updateData.hash_password = await bcrypt.hash(password, 10);
          updateData.Date_password_changed_date = new Date();
        }
        if (N_password_expiry_days) {
          const passwordExpiryDate = new Date();
          passwordExpiryDate.setDate(passwordExpiryDate.getDate() + N_password_expiry_days);
          updateData.Date_password_expiry_date = passwordExpiryDate;
          updateData.N_password_expiry_days = N_password_expiry_days;
        }
        const user = await UserMaster.findOneAndUpdate(
          { user_id: id },
          updateData,
          { new: true, runValidators: true }
        ).select('-hash_password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json(user);
      }
      if (method === 'DELETE' && id) {
        const user = await UserMaster.findOneAndDelete({ user_id: id });
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json({ message: 'User deleted successfully' });
      }
    }

    // User Login History routes
    if (resource === 'user-login-history') {
      if (method === 'GET' && !id) {
        // GET /api/user-login-history
        const histories = await UserLoginHistory.find().sort({ Date_login_Date: -1, Time_login_Time: -1 });
        return res.json(histories);
      }
      if (method === 'GET' && id === 'user' && subResource) {
        // GET /api/user-login-history/user/:userId
        const histories = await UserLoginHistory.find({ user_id: subResource })
          .sort({ Date_login_Date: -1, Time_login_Time: -1 });
        return res.json(histories);
      }
      if (method === 'GET' && id) {
        // GET /api/user-login-history/:id
        const history = await UserLoginHistory.findById(id);
        if (!history) return res.status(404).json({ error: 'Login history not found' });
        return res.json(history);
      }
      if (method === 'POST') {
        const { user_id, Date_login_Date, Time_login_Time, Date_Logout_Date, Time_Logout_Time } = req.body;
        const loginHistory = new UserLoginHistory({
          user_id,
          Date_login_Date: Date_login_Date ? new Date(Date_login_Date) : new Date(),
          Time_login_Time: Time_login_Time || new Date().toTimeString().slice(0, 8),
          Date_Logout_Date: Date_Logout_Date ? new Date(Date_Logout_Date) : undefined,
          Time_Logout_Time: Time_Logout_Time || undefined,
        });
        await loginHistory.save();
        return res.status(201).json(loginHistory);
      }
      if (method === 'PUT' && id) {
        // PUT /api/user-login-history/:id
        const { Date_login_Date, Time_login_Time, Date_Logout_Date, Time_Logout_Time } = req.body;
        const updateData: any = {};
        if (Date_login_Date) updateData.Date_login_Date = new Date(Date_login_Date);
        if (Time_login_Time) updateData.Time_login_Time = Time_login_Time;
        if (Date_Logout_Date) updateData.Date_Logout_Date = new Date(Date_Logout_Date);
        if (Time_Logout_Time) updateData.Time_Logout_Time = Time_Logout_Time;
        const history = await UserLoginHistory.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!history) return res.status(404).json({ error: 'Login history not found' });
        return res.json(history);
      }
      if (method === 'DELETE' && id) {
        // DELETE /api/user-login-history/:id
        const history = await UserLoginHistory.findByIdAndDelete(id);
        if (!history) return res.status(404).json({ error: 'Login history not found' });
        return res.json({ message: 'Login history deleted successfully' });
      }
    }

    // 404 for unknown routes
    console.log(`[API] Route not found: ${method} ${req.url}`);
    return res.status(404).json({ error: 'Route not found', path: req.url });
  } catch (error: any) {
    // #region agent log
    logBackend('api/[...path].ts:470', 'Global error handler', {error:error.message,code:error.code,name:error.name,url:req.url,method:req.method,stack:error.stack});
    // #endregion
    console.error('[API] Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });
    
    // Return error response
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}
