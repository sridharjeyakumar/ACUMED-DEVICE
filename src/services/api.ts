// Next.js API routes - always use relative path
const API_BASE_URL = '/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:4',message:'fetchAPI called',data:{endpoint,method:options.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H5'})}).catch(()=>{});
  // #endregion
  // API_BASE_URL is always set (either '/api' for proxy or '/api' for same domain)
  
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:9',message:'Before fetch request',data:{url:`${API_BASE_URL}${endpoint}`,method:options.method,hasBody:!!options.body},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:18',message:'After fetch response',data:{status:response.status,statusText:response.statusText,ok:response.ok,endpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:22',message:'Response not OK',data:{status:response.status,error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      throw new Error(error.error || 'Request failed');
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:26',message:'fetchAPI success',data:{endpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    return response.json();
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0d8ecf44-de1f-4953-bc2e-dcacfba1f878',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/api.ts:29',message:'fetchAPI error',data:{endpoint,error:error.message,name:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    // Handle network errors (server not running, CORS, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please check your network connection and try again.');
    }
    throw error;
  }
}

// Menu Master API
export const menuAPI = {
  getAll: () => fetchAPI('/menus'),
  getById: (id: string) => fetchAPI(`/menus/${id}`),
  create: (data: any) => fetchAPI('/menus', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/menus/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/menus/${id}`, { method: 'DELETE' }),
};

// Role Master API
export const roleAPI = {
  getAll: () => fetchAPI('/roles'),
  getById: (id: string) => fetchAPI(`/roles/${id}`),
  create: (data: any) => fetchAPI('/roles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/roles/${id}`, { method: 'DELETE' }),
};

// Menu Access Master API
export const menuAccessAPI = {
  getAll: () => fetchAPI('/menu-access'),
  getById: (roldId: string, menuId: string) => fetchAPI(`/menu-access/${roldId}/${menuId}`),
  create: (data: any) => fetchAPI('/menu-access', { method: 'POST', body: JSON.stringify(data) }),
  update: (roldId: string, menuId: string, data: any) => 
    fetchAPI(`/menu-access/${roldId}/${menuId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (roldId: string, menuId: string) => 
    fetchAPI(`/menu-access/${roldId}/${menuId}`, { method: 'DELETE' }),
};

// User Master API
export const userAPI = {
  getAll: () => fetchAPI('/users'),
  getById: (id: string) => fetchAPI(`/users/${id}`),
  create: (data: any) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
};

// User Login History API
export const userLoginHistoryAPI = {
  getAll: () => fetchAPI('/user-login-history'),
  getByUserId: (userId: string) => fetchAPI(`/user-login-history/user/${userId}`),
  getById: (id: string) => fetchAPI(`/user-login-history/${id}`),
  create: (data: any) => fetchAPI('/user-login-history', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => 
    fetchAPI(`/user-login-history/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/user-login-history/${id}`, { method: 'DELETE' }),
};

