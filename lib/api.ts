const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { params, ...fetchOptions } = options;

  let url = `${API_URL}${endpoint}`;
  
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطأ في الاتصال' }));
    const err = new Error(error.error || 'حدث خطأ') as any;
    err.error = error.error || 'حدث خطأ';
    err.existingTransaction = error.existingTransaction;
    err.sessionExpired = error.sessionExpired || false;
    // If session expired, clear cookie and redirect
    if (error.sessionExpired && typeof window !== 'undefined') {
      // Store session expiration message in sessionStorage for display on login page
      sessionStorage.setItem('sessionExpired', 'true');
      window.location.href = '/login';
    }
    throw err;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  
  logout: () => fetchAPI('/auth/logout', { method: 'POST' }),
  
  me: () => fetchAPI('/auth/me'),

  // Inventories
  getInventories: () => fetchAPI('/inventories'),
  
  getInventoryStocks: (inventoryId: string, params?: any) =>
    fetchAPI(`/inventories/${inventoryId}/stocks`, { params }),

  getInventoryTransfers: (params?: any) =>
    fetchAPI('/inventories/transfers', { params }),
  
  createInventoryTransfer: (data: any) =>
    fetchAPI('/inventories/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInventoryTransfer: (id: string) =>
    fetchAPI(`/inventories/transfers/${id}`),

  getStockMovements: (params?: any) =>
    fetchAPI('/inventories/stock-movements', { params }),

  // Items
  getItems: (section?: string) =>
    fetchAPI('/items', { params: section ? { section } : undefined }),
  
  createItem: (data: any) =>
    fetchAPI('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateItemPrices: (id: string, data: any) =>
    fetchAPI(`/items/${id}/prices`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteItem: (id: string) =>
    fetchAPI(`/items/${id}`, {
      method: 'DELETE',
    }),

  // Customers
  getCustomers: (params?: { type?: string; division?: string }) =>
    fetchAPI('/customers', { params }),
  
  createCustomer: (data: any) =>
    fetchAPI('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getCustomer: (id: string) => fetchAPI(`/customers/${id}`),

  // Suppliers
  getSuppliers: () => fetchAPI('/suppliers'),
  
  createSupplier: (data: any) =>
    fetchAPI('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSupplierOrders: (supplierId: string) => fetchAPI(`/suppliers/${supplierId}/orders`),

  // Sales
  getSalesInvoices: (params?: any) =>
    fetchAPI('/sales/invoices', { params }),
  
  createSalesInvoice: (data: any) =>
    fetchAPI('/sales/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getSalesInvoice: (id: string) => fetchAPI(`/sales/invoices/${id}`),
  
  addPayment: (id: string, data: any) =>
    fetchAPI(`/sales/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  confirmInvoicePayment: (id: string) =>
    fetchAPI(`/sales/invoices/${id}/confirm-payment`, {
      method: 'POST',
    }),

  deliverInvoice: (id: string, notes?: string) =>
    fetchAPI(`/sales/invoices/${id}/deliver`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  partialDeliverInvoice: (id: string, data: { notes?: string; items: Array<{ itemId: string; allocations: Array<{ batchId: string; quantity: number }>; giftQty?: number }> }) =>
    fetchAPI(`/sales/invoices/${id}/partial-deliver`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Uploads
  uploadFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_URL}/uploads`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    }).then(async (res) => {
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const err = new Error(errJson.error || 'فشل رفع الملف');
        throw err;
      }
      return res.json();
    });
  },

  // Procurement
  getProcOrders: (params?: any) =>
    fetchAPI('/procurement/orders', { params }),
  
  createProcOrder: (data: any) =>
    fetchAPI('/procurement/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getProcOrder: (id: string) => fetchAPI(`/procurement/orders/${id}`),
  
  confirmProcOrderPayment: (id: string) =>
    fetchAPI(`/procurement/orders/${id}/confirm-payment`, {
      method: 'POST',
    }),

  addProcOrderPayment: (id: string, data: any) =>
    fetchAPI(`/procurement/orders/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancelProcOrder: (id: string, data?: { reason?: string; notes?: string }) =>
    fetchAPI(`/procurement/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  returnProcOrder: (id: string, data: any) =>
    fetchAPI(`/procurement/orders/${id}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  receiveOrder: (id: string, notes?: string, partial?: boolean, batches?: any[]) =>
    fetchAPI(`/procurement/orders/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify({ notes, partial, batches }),
    }),

  addProcOrderGifts: (id: string, gifts: Array<{ itemId: string; giftQty: number }>) =>
    fetchAPI(`/procurement/orders/${id}/add-gifts`, {
      method: 'POST',
      body: JSON.stringify({ gifts }),
    }),

  // Accounting
  getExpenses: (params?: any) =>
    fetchAPI('/accounting/expenses', { params }),
  
  createExpense: (data: any) =>
    fetchAPI('/accounting/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getOpeningBalances: (params?: any) =>
    fetchAPI('/accounting/opening-balances', { params }),
  
  createOpeningBalance: (data: any) =>
    fetchAPI('/accounting/opening-balances', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getBalanceSummary: (params?: any) =>
    fetchAPI('/accounting/balance/summary', { params }),
  
  getLiquidCash: (params?: any) =>
    fetchAPI('/accounting/liquid-cash', { params }),
  
  closeBalance: () =>
    fetchAPI('/accounting/balance/close', { method: 'POST' }),
  
  openBalance: (data: any) =>
    fetchAPI('/accounting/balance/open', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getBalanceStatus: () =>
    fetchAPI('/accounting/balance/status'),
  
  getBalanceSessions: () =>
    fetchAPI('/accounting/balance/sessions'),
  
  getAuditLogs: (params?: any) =>
    fetchAPI('/accounting/audit', { params }),

  getDailyReport: (date?: string) =>
    fetchAPI('/accounting/daily-report', { params: date ? { date } : undefined }),

  getCashExchanges: () =>
    fetchAPI('/accounting/cash-exchanges'),
  
  createCashExchange: (data: any) =>
    fetchAPI('/accounting/cash-exchanges', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Employees
  getEmployees: () => fetchAPI('/employees'),
  
  createEmployee: (data: any) =>
    fetchAPI('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateEmployee: (id: string, data: any) =>
    fetchAPI(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteEmployee: (id: string) =>
    fetchAPI(`/employees/${id}`, {
      method: 'DELETE',
    }),

  // Salaries
  getEmployeeSalaries: (employeeId: string, params?: any) =>
    fetchAPI(`/employees/${employeeId}/salaries`, { params }),
  
  createSalary: (data: any) =>
    fetchAPI('/employees/salaries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  paySalary: (id: string) =>
    fetchAPI(`/employees/salaries/${id}/pay`, {
      method: 'POST',
    }),

  // Advances
  getEmployeeAdvances: (employeeId: string) =>
    fetchAPI(`/employees/${employeeId}/advances`),
  
  createAdvance: (data: any) =>
    fetchAPI('/employees/advances', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  payAdvance: (id: string) =>
    fetchAPI(`/employees/advances/${id}/pay`, {
      method: 'POST',
    }),

  // Reports
  getSalesReports: (params?: any) =>
    fetchAPI('/sales/reports', { params }),

  getDailySalesByItem: (params?: any) =>
    fetchAPI('/sales/reports/daily-by-item', { params }),
  
  getProcurementReports: (params?: any) =>
    fetchAPI('/procurement/reports', { params }),

  // Expiry Management
  getExpiryAlerts: (days?: number) =>
    fetchAPI('/inventories/expiry-alerts', { params: days ? { days: days.toString() } : undefined }),
  
  getStockBatches: (inventoryId: string, itemId: string) =>
    fetchAPI(`/inventories/${inventoryId}/stocks/${itemId}/batches`),
};

