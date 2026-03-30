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
// export const productStatusAPI = {
//   getAll: () => fetchAPI('/product-statuses'),
//   getById: (id: string) => fetchAPI(`/product-statuses/${id}`),
//   create: (data: any) => fetchAPI('/product-statuses', { method: 'POST', body: JSON.stringify(data) }),
//   update: (id: string, data: any) => fetchAPI(`/product-statuses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
//   delete: (id: string) => fetchAPI(`/product-statuses/${id}`, { method: 'DELETE' }),
// };

// Machine Event API
export const machineEventAPI = {
  getAll: (params?: { machine_id?: string; batch_no?: string }) => {
    const qs = params
      ? Object.entries(params)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
          .join('&')
      : '';
    return fetchAPI(`/machine-events${qs ? `?${qs}` : ''}`);
  },
  getById: (id: number) => fetchAPI(`/machine-events/${id}`),
  create: (data: any) => fetchAPI('/machine-events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`/machine-events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI(`/machine-events/${id}`, { method: 'DELETE' }),
};

// Product BOM materials by product_id
export const productBomAPI = {
  getByProductId: (productId: string) =>
    fetchAPI(`/product-bom?product_id=${encodeURIComponent(productId)}`),
};

// Available rolls from GoodsReceiptUnits (status=A, balance_qty>0, sorted roll_no DESC)
export const availableRollsAPI = {
  getByMaterialId: (materialId: string) =>
    fetchAPI(`/goods-receipt-units?material_id=${encodeURIComponent(materialId)}&available=true`),
};

// MachineEventMaterial by machine_event_id
export const machineEventMaterialAPI = {
  getByEventId: (machineEventId: number) =>
    fetchAPI(`/machine-event-materials?machine_event_id=${machineEventId}`),
  getOpenRecord: (machineId: string, openEventTypeId: string) =>
    fetchAPI(`/machine-event-materials?machine_id=${encodeURIComponent(machineId)}&open_event_type_id=${encodeURIComponent(openEventTypeId)}`),
};

// BatchMaterialSummary by batch_no + optional material_id
export const batchMaterialSummaryAPI = {
  getByBatchAndMaterial: (batchNo: string, materialId?: string) => {
    const params = new URLSearchParams({ batch_no: batchNo });
    if (materialId) params.set('material_id', materialId);
    return fetchAPI(`/batch-material-summary?${params.toString()}`);
  },
};


// Machine Event Type Master API
export const machineEventTypeAPI = {
  getAll: () => fetchAPI('/machine-event-types'),
  getById: (id: string) => fetchAPI(`/machine-event-types/${id}`),
  create: (data: any) => fetchAPI('/machine-event-types', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/machine-event-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/machine-event-types/${id}`, { method: 'DELETE' }),
};

// Machine Stop Reason Master API
export const machineStopReasonAPI = {
  getAll: () => fetchAPI('/machine-stop-reasons'),
  getById: (id: string) => fetchAPI(`/machine-stop-reasons/${id}`),
  create: (data: any) => fetchAPI('/machine-stop-reasons', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/machine-stop-reasons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/machine-stop-reasons/${id}`, { method: 'DELETE' }),
};

// Batch Status Master API
export const batchStatusAPI = {
  getAll: () => fetchAPI('/batch-statuses'),
  getById: (id: string) => fetchAPI(`/batch-statuses/${id}`),
  create: (data: any) => fetchAPI('/batch-statuses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/batch-statuses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/batch-statuses/${id}`, { method: 'DELETE' }),
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

// Location Master API
export const locationAPI = {
  getAll: () => fetchAPI('/locations'),
  getById: (id: string) => fetchAPI(`/locations/${id}`),
  create: (data: any) => fetchAPI('/locations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/locations/${id}`, { method: 'DELETE' }),
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

// Vendor Master API
export const vendorAPI = {
  getAll: () => fetchAPI('/vendors'),
  getById: (id: string) => fetchAPI(`/vendors/${id}`),
  create: (data: any) => fetchAPI('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/vendors/${id}`, { method: 'DELETE' }),
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
// export const cartonCapacityAPI = {
//   getAll: () => fetchAPI('/carton-capacities'),
//   getById: (id: string) => fetchAPI(`/carton-capacities/${id}`),
//   create: (data: any) => fetchAPI('/carton-capacities', { method: 'POST', body: JSON.stringify(data) }),
//   update: (id: string, data: any) => fetchAPI(`/carton-capacities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
//   delete: (id: string) => fetchAPI(`/carton-capacities/${id}`, { method: 'DELETE' }),
// };
// Carton Capacity Master API
export const cartonCapacityAPI = {
  getAll: (params?: { productId?: string; packSizeId?: string; cartonTypeId?: string; active?: boolean }) => {
    let url = '/carton-capacities';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.productId) queryParams.append('productId', params.productId);
      if (params.packSizeId) queryParams.append('packSizeId', params.packSizeId);
      if (params.cartonTypeId) queryParams.append('cartonTypeId', params.cartonTypeId);
      if (params.active !== undefined) queryParams.append('active', String(params.active));
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    return fetchAPI(url);
  },
  getById: (id: string) => fetchAPI(`/carton-capacities/${id}`),
  create: (data: any) => fetchAPI('/carton-capacities', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  update: (id: string, data: any) => fetchAPI(`/carton-capacities/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (id: string) => fetchAPI(`/carton-capacities/${id}`, { 
    method: 'DELETE' 
  }),
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

// Update the cartonTypeAPI to uomAPI
export const uomAPI = {
    getAll: async () => {
        const response = await fetch('/api/uom');
        if (!response.ok) throw new Error('Failed to fetch UOMs');
        return response.json();
    },
    getById: async (id: string) => {
        const response = await fetch(`/api/uom/${id}`);
        if (!response.ok) throw new Error('Failed to fetch UOM');
        return response.json();
    },
    create: async (data: any) => {
        const response = await fetch('/api/uom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create UOM');
        return response.json();
    },
    update: async (id: string, data: any) => {
        const response = await fetch(`/api/uom/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update UOM');
        return response.json();
    },
    delete: async (id: string) => {
        const response = await fetch(`/api/uom/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete UOM');
        return response.json();
    },
};

export const transactionAPI = {
    getAll: async () => {
        const response = await fetch('/api/transactions');
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return response.json();
    },
    
    getById: async (batchNo: string) => {
        const response = await fetch(`/api/transactions/${batchNo}`);
        if (!response.ok) throw new Error('Failed to fetch transaction');
        return response.json();
    },
    
    create: async (data: any) => {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create transaction');
        }
        return response.json();
    },
    
    update: async (batchNo: string, data: any) => {
        const response = await fetch(`/api/transactions/${batchNo}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update transaction');
        }
        return response.json();
    },
    
    patch: async (batchNo: string, data: any) => {
        const response = await fetch(`/api/transactions/${batchNo}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update transaction');
        }
        return response.json();
    },
    
    delete: async (batchNo: string) => {
        const response = await fetch(`/api/transactions/${batchNo}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete transaction');
        }
        return response.json();
    },
    
    updateStatus: async (batchNo: string, status: 'P' | 'R' | 'W' | 'C') => {
        const response = await fetch(`/api/transactions/${batchNo}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_batch_status_id: status }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update status');
        }
        return response.json();
    }
};
// services/api.ts - Add this to your existing api.ts file

export const productionPlanDetailAPI = {
    getAll: async () => {
        const response = await fetch('/api/production-plan-details');
        if (!response.ok) throw new Error('Failed to fetch production plan details');
        return response.json();
    },
    
    getByBatchNo: async (batchNo: string) => {
        const response = await fetch(`/api/production-plan-details?batch_no=${batchNo}`);
        if (!response.ok) throw new Error('Failed to fetch production plan details');
        return response.json();
    },
    
    create: async (data: any) => {
        const response = await fetch('/api/production-plan-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create production plan detail');
        }
        return response.json();
    },
    
    createMany: async (data: any[]) => {
        const response = await fetch('/api/production-plan-details/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create production plan details');
        }
        return response.json();
    },
    
    update: async (batchNo: string, sno: number, data: any) => {
        const response = await fetch(`/api/production-plan-details/${batchNo}/${sno}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update production plan detail');
        }
        return response.json();
    },
    
    delete: async (batchNo: string, sno: number) => {
        const response = await fetch(`/api/production-plan-details/${batchNo}/${sno}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete production plan detail');
        }
        return response.json();
    },
    
    deleteByBatchNo: async (batchNo: string) => {
        const response = await fetch(`/api/production-plan-details/batch/${batchNo}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete production plan details');
        }
        return response.json();
    }
};


export const goodsReceiptHeaderAPI = {
    /** Fetch all headers */
    getAll: () =>
        fetchAPI('/goods-receipt-headers'),

    /** Fetch a single header by material_doc_no */
    getById: (docNo: string) =>
        fetchAPI(`/goods-receipt-headers/${docNo}`),

    /** Create a new header (material_doc_no is auto-generated by the server) */
    create: (data: Record<string, any>) =>
        fetchAPI('/goods-receipt-headers', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /** Update an existing header */
    update: (docNo: string, data: Record<string, any>) =>
        fetchAPI(`/goods-receipt-headers/${docNo}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /** Delete a header */
    delete: (docNo: string) =>
        fetchAPI(`/goods-receipt-headers/${docNo}`, { method: 'DELETE' }),

    /** Cancel a header (set active=false) */
    cancel: (docNo: string) =>
        fetchAPI(`/goods-receipt-headers/${docNo}`, { method: 'PATCH', body: JSON.stringify({ active: false }) }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Goods Receipt Detail  (one row per material per document)
// ─────────────────────────────────────────────────────────────────────────────
export const goodsReceiptDetailAPI = {
    /**
     * Fetch all detail rows for a given header.
     * @param docNo  material_doc_no  (e.g. "M2500001")
     */
    getByDocNo: (docNo: string) =>
        fetchAPI(`/goods-receipt-details?material_doc_no=${encodeURIComponent(docNo)}`),

    /** Fetch a single detail row by its MongoDB _id */
    getById: (id: string) =>
        fetchAPI(`/goods-receipt-details/${id}`),

    /**
     * Create a detail row.
     * Required: material_doc_no, material_id, invoice_total_nett_qty, uom
     */
    create: (data: Record<string, any>) =>
        fetchAPI('/goods-receipt-details', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Update a detail row by its MongoDB _id.
     * Updatable: invoice_total_nett_qty, uom, total_pockets, total_rolls,
     *            existing_stock_qty, existing_total_rolls
     */
    update: (id: string, data: Record<string, any>) =>
        fetchAPI(`/goods-receipt-details/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /** Delete a single detail row by its MongoDB _id */
    delete: (id: string) =>
        fetchAPI(`/goods-receipt-details/${id}`, { method: 'DELETE' }),

    /**
     * Delete ALL detail rows for a header (used when re-saving the whole form).
     * @param docNo  material_doc_no
     */
    deleteByDocNo: (docNo: string) =>
        fetchAPI(`/goods-receipt-details?material_doc_no=${encodeURIComponent(docNo)}`, {
            method: 'DELETE',
        }),

    /**
     * Bulk-upsert: replace all details for a header in one call.
     * Internally: deleteByDocNo → create each row sequentially.
     */
    replaceAll: async (docNo: string, rows: Record<string, any>[]) => {
        await goodsReceiptDetailAPI.deleteByDocNo(docNo);
        return Promise.all(
            rows.map(row =>
                goodsReceiptDetailAPI.create({ ...row, material_doc_no: docNo })
            )
        );
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Goods Receipt Units  (unit-level breakdown under each detail row)
// ─────────────────────────────────────────────────────────────────────────────
export const goodsReceiptUnitsAPI = {
    /**
     * Fetch all units for a header (all materials).
     * @param docNo  material_doc_no
     */
    getByDocNo: (docNo: string) =>
        fetchAPI(`/goods-receipt-units?material_doc_no=${encodeURIComponent(docNo)}`),

    /**
     * Fetch units for one specific detail row (one material).
     * @param docNo      material_doc_no
     * @param materialId material_id
     */
    getByDetail: (docNo: string, materialId: string) =>
        fetchAPI(
            `/goods-receipt-units?material_doc_no=${encodeURIComponent(docNo)}&material_id=${encodeURIComponent(materialId)}`
        ),

    /** Fetch a single unit by MongoDB _id */
    getById: (id: string) =>
        fetchAPI(`/goods-receipt-units/${id}`),

    /**
     * Create a unit row.
     * Required: material_doc_no, material_id, nett_qty, actual_qty, balance_qty
     * sno is auto-incremented by the server if omitted.
     * balance_qty is recomputed server-side as actual - consumed - rejected.
     */
    create: (data: Record<string, any>) =>
        fetchAPI('/goods-receipt-units', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Update a unit by MongoDB _id.
     * Updatable: packet_no, roll_no, nett_qty, uom, actual_qty,
     *            consumed_qty, rejected_qty, balance_qty (auto-recomputed), status
     * PK fields (material_doc_no, material_id, sno) are immutable.
     */
    update: (id: string, data: Record<string, any>) =>
        fetchAPI(`/goods-receipt-units/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /** Delete a single unit by MongoDB _id */
    delete: (id: string) =>
        fetchAPI(`/goods-receipt-units/${id}`, { method: 'DELETE' }),

    /**
     * Delete ALL units for a header.
     * Useful when doing a full re-save.
     */
    deleteByDocNo: (docNo: string) =>
        fetchAPI(`/goods-receipt-units?material_doc_no=${encodeURIComponent(docNo)}`, {
            method: 'DELETE',
        }),

    /**
     * Delete all units under a specific detail row (one material).
     */
    deleteByDetail: (docNo: string, materialId: string) =>
        fetchAPI(
            `/goods-receipt-units?material_doc_no=${encodeURIComponent(docNo)}&material_id=${encodeURIComponent(materialId)}`,
            { method: 'DELETE' }
        ),

    /**
     * Bulk-upsert: replace all units for one detail row.
     * Internally: deleteByDetail → create each unit row.
     */
    replaceAll: async (docNo: string, materialId: string, units: Record<string, any>[]) => {
        await goodsReceiptUnitsAPI.deleteByDetail(docNo, materialId);
        return Promise.all(
            units.map((unit, i) =>
                goodsReceiptUnitsAPI.create({
                    ...unit,
                    material_doc_no: docNo,
                    material_id:     materialId,
                    sno:             i + 1,
                })
            )
        );
    },
};

// ── Add this block to the END of your existing services/api.ts ──

export const materialStockAPI = {

    // GET /api/material-stocks/:material_id
    getByMaterialId: (material_id: string) =>
        fetchAPI(`/material-stocks/${encodeURIComponent(material_id.trim().toUpperCase())}`),

    // GET /api/material-stocks
    getAll: () =>
        fetchAPI('/material-stocks'),

    // POST /api/material-stocks
    create: (data: Record<string, any>) =>
        fetchAPI('/material-stocks', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // PUT /api/material-stocks/:material_id
    update: (material_id: string, data: Record<string, any>) =>
        fetchAPI(`/material-stocks/${encodeURIComponent(material_id.trim().toUpperCase())}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // DELETE /api/material-stocks/:material_id
    delete: (material_id: string) =>
        fetchAPI(`/material-stocks/${encodeURIComponent(material_id.trim().toUpperCase())}`, {
            method: 'DELETE',
        }),
};

// Production API
export const productionAPI = {
  getAll: () => fetchAPI('/productions'),
  getById: (id: string) => fetchAPI(`/productions/${id}`),
  create: (data: any) => fetchAPI('/productions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/productions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/productions/${id}`, { method: 'DELETE' }),
};
export const packingAPI={
    getAll: () => fetchAPI('/packing-entry'),
    getById: (id: string) => fetchAPI(`/packing-entry/${id}`),
    create: (data: any) => fetchAPI('/packing-entry', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/packing-entry/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/packing-entry/${id}`, { method: 'DELETE' }),
}
// Product Stock API
export const productStockAPI = {
    // Adjust (upsert) stock by composite key — creates the record if it doesn't exist
    adjust: (batchNo: string, data: {
        pack_size_id: string; product_status_id: string;
        packs_delta: number; sachets_delta: number;
        product_id?: string; carton_type_id?: string; total_no_of_cartons?: number;
    }) => fetchAPI(`/product-stock/${encodeURIComponent(batchNo)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getAll: (params?: { productId?: string; batchNo?: string }) => {
        let url = '/product-stock';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.productId) queryParams.append('productId', params.productId);
            if (params.batchNo) queryParams.append('batchNo', params.batchNo);
            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }
        }
        return fetchAPI(url);
    },
    getByBatchNo: (batchNo: string) => fetchAPI(`/product-stock/${batchNo}`),
    create: (data: any) => fetchAPI('/product-stock', { 
        method: 'POST', 
        body: JSON.stringify(data) 
    }),
    update: (batchNo: string, data: any) => fetchAPI(`/product-stock/${batchNo}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
    }),
    delete: (batchNo: string) => fetchAPI(`/product-stock/${batchNo}`, { 
        method: 'DELETE' 
    }),
};

// Update productStatusAPI to include movement type filter
export const productStatusAPI = {
    getAll: (params?: { movementType?: string; active?: boolean }) => {
        let url = '/product-statuses';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.movementType) queryParams.append('movementType', params.movementType);
            if (params.active !== undefined) queryParams.append('active', String(params.active));
            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }
        }
        return fetchAPI(url);
    },
    getById: (id: string) => fetchAPI(`/product-statuses/${id}`),
    getByMovementType: (movementType: string) => 
        fetchAPI(`/product-statuses?movementType=${movementType}`),
    create: (data: any) => fetchAPI('/product-statuses', { 
        method: 'POST', 
        body: JSON.stringify(data) 
    }),
    update: (id: string, data: any) => fetchAPI(`/product-statuses/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
    }),
    delete: (id: string) => fetchAPI(`/product-statuses/${id}`, { 
        method: 'DELETE' 
    }),
};

// Update productStatusTransitionAPI to include fromStatus filter
export const productStatusTransitionAPI = {
    getAll: (params?: { active?: boolean; fromStatus?: string; toStatus?: string }) => {
        let url = '/product-status-transitions';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.active !== undefined) queryParams.append('active', String(params.active));
            if (params.fromStatus) queryParams.append('fromStatus', params.fromStatus);
            if (params.toStatus) queryParams.append('toStatus', params.toStatus);
            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }
        }
        return fetchAPI(url);
    },
    getById: (id: string) => fetchAPI(`/product-status-transitions/${id}`),
    getByFromStatus: (fromStatus: string) => 
        fetchAPI(`/product-status-transitions?fromStatus=${fromStatus}`),
    getByFromToStatus: (fromStatus: string, toStatus?: string) => {
        let url = `/product-status-transitions?fromStatus=${fromStatus}`;
        if (toStatus) {
            url += `&toStatus=${toStatus}`;
        }
        return fetchAPI(url);
    },
    create: (data: any) => fetchAPI('/product-status-transitions', { 
        method: 'POST', 
        body: JSON.stringify(data) 
    }),
    update: (id: string, data: any) => fetchAPI(`/product-status-transitions/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
    }),
    delete: (id: string) => fetchAPI(`/product-status-transitions/${id}`, { 
        method: 'DELETE' 
    }),
};
// Add this at the end of your api.ts file

// Product Movement API
export const productMovementAPI = {
    getAll: (params?: { batchNo?: string; status?: string; year?: string }) => {
        let url = '/product-movements';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.batchNo) queryParams.append('batchNo', params.batchNo);
            if (params.status) queryParams.append('status', params.status);
            if (params.year) queryParams.append('year', params.year);
            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }
        }
        return fetchAPI(url);
    },
    getById: (id: number) => fetchAPI(`/product-movements/${id}`),
    create: (data: any) => fetchAPI('/product-movements', { 
        method: 'POST', 
        body: JSON.stringify(data) 
    }),
    update: (id: number, data: any) => fetchAPI(`/product-movements/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
    }),
    delete: (id: number) => fetchAPI(`/product-movements/${id}`, { 
        method: 'DELETE' 
    }),
};