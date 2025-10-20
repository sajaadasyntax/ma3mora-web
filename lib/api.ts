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
    throw new Error(error.error || 'حدث خطأ');
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
  
  getInventoryStocks: (id: string, section?: string) =>
    fetchAPI(`/inventories/${id}/stocks`, { params: section ? { section } : undefined }),

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

  receiveOrder: (id: string, notes?: string, partial?: boolean) =>
    fetchAPI(`/procurement/orders/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify({ notes, partial }),
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
  
  getAuditLogs: (params?: any) =>
    fetchAPI('/accounting/audit', { params }),
};

