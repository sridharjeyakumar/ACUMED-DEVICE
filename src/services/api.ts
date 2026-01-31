// Next.js API routes - always use relative path
const API_BASE_URL = '/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // API_BASE_URL is always set (either '/api' for proxy or '/api' for same domain)
  
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

// Company Master API
export const companyAPI = {
  getAll: () => fetchAPI('/companies'),
  getById: (id: string) => fetchAPI(`/companies/${id}`),
  create: (data: any) => fetchAPI('/companies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/companies/${id}`, { method: 'DELETE' }),
};

// Product Status Master API
export const productStatusAPI = {
  getAll: () => fetchAPI('/product-statuses'),
  getById: (id: string) => fetchAPI(`/product-statuses/${id}`),
  create: (data: any) => fetchAPI('/product-statuses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/product-statuses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/product-statuses/${id}`, { method: 'DELETE' }),
};

// Material Status Master API
export const materialStatusAPI = {
  getAll: () => fetchAPI('/material-statuses'),
  getById: (id: string) => fetchAPI(`/material-statuses/${id}`),
  create: (data: any) => fetchAPI('/material-statuses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/material-statuses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/material-statuses/${id}`, { method: 'DELETE' }),
};

// Department Master API
export const departmentAPI = {
  getAll: () => fetchAPI('/departments'),
  getById: (id: string) => fetchAPI(`/departments/${id}`),
  create: (data: any) => fetchAPI('/departments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/departments/${id}`, { method: 'DELETE' }),
};

// Employee Grade Master API
export const employeeGradeAPI = {
  getAll: () => fetchAPI('/employee-grades'),
  getById: (id: string) => fetchAPI(`/employee-grades/${id}`),
  create: (data: any) => fetchAPI('/employee-grades', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/employee-grades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/employee-grades/${id}`, { method: 'DELETE' }),
};

