// Next.js API routes - always use relative path
const API_BASE_URL = '/api';

// async function fetchAPI(endpoint: string, options: RequestInit = {}) {
//   // API_BASE_URL is always set (either '/api' for proxy or '/api' for same domain)
  
//   try {
//     const response = await fetch(`${API_BASE_URL}${endpoint}`, {
//       ...options,
//       headers: {
//         'Content-Type': 'application/json',
//         ...options.headers,
//       },
//     });

//     if (!response.ok) {
//       const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
//       throw new Error(error.error || 'Request failed');
//     }

//     return response.json();
//   } catch (error: any) {
//     // Handle network errors (server not running, CORS, etc.)
//     if (error.name === 'TypeError' && error.message.includes('fetch')) {
//       throw new Error('Cannot connect to server. Please check your network connection and try again.');
//     }
//     throw error;
//   }
// }

// Menu Master API

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // API_BASE_URL is always set (either '/api' for proxy or '/api' for same domain)
  
  // Add timestamp for GET requests to prevent caching
  let finalEndpoint = endpoint;
  if (!options.method || options.method === 'GET') {
    const timestamp = new Date().getTime();
    const separator = endpoint.includes('?') ? '&' : '?';
    finalEndpoint = `${endpoint}${separator}_t=${timestamp}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${finalEndpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers,
      },
      cache: 'no-store',
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

// Product Category Master API
export const productCategoryAPI = {
  getAll: () => fetchAPI('/product-categories'),
  getById: (id: string) => fetchAPI(`/product-categories/${id}`),
  create: (data: any) => fetchAPI('/product-categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/product-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/product-categories/${id}`, { method: 'DELETE' }),
};

// Material Category Master API
export const materialCategoryAPI = {
  getAll: () => fetchAPI('/material-categories'),
  getById: (id: string) => fetchAPI(`/material-categories/${id}`),
  create: (data: any) => fetchAPI('/material-categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/material-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/material-categories/${id}`, { method: 'DELETE' }),
};

// Holidays Master API
export const holidaysAPI = {
  getAll: () => fetchAPI('/holidays'),
  getById: (id: string) => fetchAPI(`/holidays/${id}`),
  create: (data: any) => fetchAPI('/holidays', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/holidays/${id}`, { method: 'DELETE' }),
};

// Weekly Off Master API
export const weeklyOffAPI = {
  getAll: () => fetchAPI('/weekly-off'),
  getById: (id: string) => fetchAPI(`/weekly-off/${id}`),
  create: (data: any) => fetchAPI('/weekly-off', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/weekly-off/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/weekly-off/${id}`, { method: 'DELETE' }),
};

// Material Master API
export const materialAPI = {
  getAll: () => fetchAPI('/materials'),
  getById: (id: string) => fetchAPI(`/materials/${id}`),
  create: (data: any) => fetchAPI('/materials', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/materials/${id}`, { method: 'DELETE' }),
};

// Product Master API
// export const productAPI = {
//   getAll: () => fetchAPI('/products'),
//   getById: (id: string) => fetchAPI(`/products/${id}`),
//   create: (data: any) => fetchAPI('/products', { method: 'POST', body: JSON.stringify(data) }),
//   update: (id: string, data: any) => fetchAPI(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
//   delete: (id: string) => fetchAPI(`/products/${id}`, { method: 'DELETE' }),
// };
// Product Master API
export const productAPI = {
  getAll: () => {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    return fetchAPI(`/products?_t=${timestamp}`);
  },
  getById: (id: string) => {
    const timestamp = new Date().getTime();
    return fetchAPI(`/products/${id}?_t=${timestamp}`);
  },
  create: (data: any) => fetchAPI('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/products/${id}`, { method: 'DELETE' }),
};
// Pack Size Master API
export const packSizeAPI = {
  getAll: () => fetchAPI('/pack-sizes'),
  getById: (id: string) => fetchAPI(`/pack-sizes/${id}`),
  create: (data: any) => fetchAPI('/pack-sizes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/pack-sizes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/pack-sizes/${id}`, { method: 'DELETE' }),
};

// Carton Type Master API
export const cartonTypeAPI = {
  getAll: () => fetchAPI('/carton-types'),
  getById: (id: string) => fetchAPI(`/carton-types/${id}`),
  create: (data: any) => fetchAPI('/carton-types', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/carton-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/carton-types/${id}`, { method: 'DELETE' }),
};

// Carton Capacity Master API
export const cartonCapacityAPI = {
  getAll: () => fetchAPI('/carton-capacities'),
  getById: (id: string) => fetchAPI(`/carton-capacities/${id}`),
  create: (data: any) => fetchAPI('/carton-capacities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/carton-capacities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/carton-capacities/${id}`, { method: 'DELETE' }),
};

// Product BOM Master API
export const productBOMAPI = {
  getAll: () => fetchAPI('/product-bom'),
  getById: (id: string) => fetchAPI(`/product-bom/${id}`),
  create: (data: any) => fetchAPI('/product-bom', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/product-bom/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/product-bom/${id}`, { method: 'DELETE' }),
};

// Employee Master API
export const employeeAPI = {
  getAll: () => fetchAPI('/employees'),
  getById: (id: string) => fetchAPI(`/employees/${id}`),
  create: (data: any) => fetchAPI('/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/employees/${id}`, { method: 'DELETE' }),
};

// Collection Bin Master API
export const collectionBinAPI = {
  getAll: () => fetchAPI('/collection-bins'),
  getById: (id: string) => fetchAPI(`/collection-bins/${id}`),
  create: (data: any) => fetchAPI('/collection-bins', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/collection-bins/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/collection-bins/${id}`, { method: 'DELETE' }),
};

// COA Checklist Master API
export const coaChecklistAPI = {
  getAll: () => fetchAPI('/coa-checklists'),
  getById: (id: string) => fetchAPI(`/coa-checklists/${id}`),
  create: (data: any) => fetchAPI('/coa-checklists', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/coa-checklists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/coa-checklists/${id}`, { method: 'DELETE' }),
};

// COA Checklist Detail API
export const coaChecklistDetailAPI = {
  getAll: () => fetchAPI('/coa-checklist-details'),
  getById: (id: string) => fetchAPI(`/coa-checklist-details/${id}`),
  create: (data: any) => fetchAPI('/coa-checklist-details', { method: 'POST', body: JSON.stringify(data) }),
  update: (checklistId: string, checklistSno: number, data: any) => 
    fetchAPI('/coa-checklist-details', { 
      method: 'PUT', 
      body: JSON.stringify({ checklistId, checklistSno, ...data })
    }),
  delete: (id: string) => fetchAPI(`/coa-checklist-details/${id}`, { method: 'DELETE' }),
  deleteAll: () => fetchAPI('/coa-checklist-details', { method: 'DELETE' }),
};

