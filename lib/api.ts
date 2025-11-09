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

  assignProcOrderDelivered: (id: string) =>
    fetchAPI(`/procurement/orders/${id}/assign-delivered`, {
      method: 'POST',
    }),

  // Accounting
  getExpenses: (params?: any) =>
    fetchAPI('/accounting/expenses', { params }),
  
  createExpense: (data: any) =>
    fetchAPI('/accounting/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getIncome: (params?: any) =>
    fetchAPI('/accounting/income', { params }),
  
  createIncome: (data: any) =>
    fetchAPI('/accounting/income', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  payInboundDebt: (id: string, data: { method: string }) =>
    fetchAPI(`/accounting/income/${id}/pay-debt`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  payOutboundDebt: (id: string, data: { method: string }) =>
    fetchAPI(`/accounting/expenses/${id}/pay-debt`, {
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
  
  getReceivablesPayables: (params?: any) =>
    fetchAPI('/accounting/receivables-payables', { params }),
  
  getAssetsLiabilities: () =>
    fetchAPI('/accounting/assets-liabilities'),
  
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

  // Employee Report
  getEmployeeReport: (params?: { startDate?: string; endDate?: string; employeeId?: string }) =>
    fetchAPI('/employees/report', { params }),

  // Reports
  getSalesReports: (params?: any) =>
    fetchAPI('/sales/reports', { params }),

  getDailySalesByItem: (params?: any) =>
    fetchAPI('/sales/reports/daily-by-item', { params }),
  
  getProcurementReports: (params?: any) =>
    fetchAPI('/procurement/reports', { params }),

  // Outstanding Fees
  getOutstandingFees: (params?: { section?: string; period?: string; startDate?: string; endDate?: string }) =>
    fetchAPI('/accounting/outstanding-fees', { params }),

  // Customer Report
  getCustomerReport: (params?: { startDate?: string; endDate?: string; type?: string; customerId?: string; paymentMethod?: string }) =>
    fetchAPI('/accounting/customer-report', { params }),

  // Supplier Report
  getSupplierReport: (params?: { startDate?: string; endDate?: string; supplierId?: string; paymentMethod?: string }) =>
    fetchAPI('/accounting/supplier-report', { params }),

  // Bank Transactions
  getBankTransactions: (params?: { startDate?: string; endDate?: string; method?: string }) =>
    fetchAPI('/accounting/bank-transactions', { params }),

  // Daily Income/Loss Report
  getDailyIncomeLoss: (params?: { date?: string; startDate?: string; endDate?: string; method?: string }) =>
    fetchAPI('/accounting/daily-income-loss', { params }),

  // Commission Report
  getCommissionReport: (params?: { startDate?: string; endDate?: string; supplierId?: string; inventoryId?: string; section?: string }) =>
    fetchAPI('/accounting/commissions', { params }),

  // Aggregators
  recalculateAggregators: (data: { startDate: string; endDate: string; inventoryId?: string; section?: string }) =>
    fetchAPI('/accounting/aggregators/recalculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Expiry Management
  getExpiryAlerts: (days?: number) =>
    fetchAPI('/inventories/expiry-alerts', { params: days ? { days: days.toString() } : undefined }),
  
  getStockBatches: (inventoryId: string, itemId: string) =>
    fetchAPI(`/inventories/${inventoryId}/stocks/${itemId}/batches`),

  // User Management (Developer Panel)
  getUsers: () => fetchAPI('/users'),
  
  createUser: (data: any) =>
    fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  deleteUser: (id: string) =>
    fetchAPI(`/users/${id}`, {
      method: 'DELETE',
    }),
  
  updateUserPassword: (id: string, password: string) =>
    fetchAPI(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),
};

