export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SDG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-US').format(n);
}

export const roleLabels: Record<string, string> = {
  SALES_GROCERY: 'مبيعات - بقالة',
  SALES_BAKERY: 'مبيعات - أفران',
  INVENTORY: 'أمين مخزن',
  PROCUREMENT: 'مشتريات',
  ACCOUNTANT: 'محاسب',
  AUDITOR: 'مراجع داخلي',
  MANAGER: 'مدير',
};

export const sectionLabels: Record<string, string> = {
  GROCERY: 'بقالة',
  BAKERY: 'أفران',
};

export const customerTypeLabels: Record<string, string> = {
  WHOLESALE: 'جملة',
  RETAIL: 'قطاعي',
};

export const paymentMethodLabels: Record<string, string> = {
  CASH: 'كاش',
  BANK: 'بنكك',
  BANK_NILE: 'بنك النيل',
  COMMISSION: 'عمولة',
};

export const paymentStatusLabels: Record<string, string> = {
  PAID: 'مدفوعة',
  PARTIAL: 'مدفوعة جزئياً',
  CREDIT: 'دفع آجل',
};

export const deliveryStatusLabels: Record<string, string> = {
  NOT_DELIVERED: 'غير مُسلَّمة',
  PARTIAL: 'تسليم جزئي',
  DELIVERED: 'مُسلَّمة',
};

export const procOrderStatusLabels: Record<string, string> = {
  CREATED: 'جديد',
  RECEIVED: 'مستلم',
  PARTIAL: 'مستلم جزئياً',
  CANCELLED: 'ملغي',
};

