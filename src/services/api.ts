// Use proxy in development, or direct URL if VITE_API_URL is set
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors (server not running, CORS, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend server is running on http://localhost:3001');
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

