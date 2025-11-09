'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Input from '@/components/Input';
import { formatCurrency, formatDate, paymentMethodLabels, sectionLabels, customerTypeLabels, paymentStatusLabels, deliveryStatusLabels, procOrderStatusLabels } from '@/lib/utils';
import { generatePDF } from '@/lib/pdfUtils';
import { ensureAggregatorsUpdated } from '@/lib/aggregatorUtils';

export default function OutstandingFeesPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filters, setFilters] = useState({
    section: 'ALL',
    period: 'ALL',
    startDate: '',
    endDate: '',
    type: 'ALL', // 'ALL', 'CUSTOMERS', 'SUPPLIERS'
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.section !== 'ALL') {
        params.section = filters.section;
      }
      if (filters.startDate && filters.endDate) {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      } else if (filters.period !== 'ALL') {
        params.period = filters.period;
      }
      if (filters.type !== 'ALL') {
        params.type = filters.type;
      }
      
      // Calculate date range based on period for aggregator update
      let dateStart: string | null = null;
      let dateEnd: string | null = null;
      if (filters.period !== 'ALL') {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        dateEnd = endDate.toISOString().split('T')[0];
        
        const startDate = new Date();
        if (filters.period === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (filters.period === 'week') {
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
        } else if (filters.period === 'month') {
          startDate.setMonth(startDate.getMonth() - 1);
          startDate.setHours(0, 0, 0, 0);
        } else if (filters.period === 'year') {
          startDate.setFullYear(startDate.getFullYear() - 1);
          startDate.setHours(0, 0, 0, 0);
        }
        dateStart = startDate.toISOString().split('T')[0];
      }
      
      // Ensure aggregators are updated before loading report
      await ensureAggregatorsUpdated(dateStart, dateEnd, {
        section: filters.section !== 'ALL' ? filters.section : undefined,
        silent: true,
      });
      
      const result = await api.getOutstandingFees(params);
      setData(result);
    } catch (error) {
      console.error('Error loading outstanding fees:', error);
      alert('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!data) return;
    const currentDate = new Date().toLocaleDateString('ar-SD', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const sectionLabel = filters.section === 'ALL' ? 'الكل' : sectionLabels[filters.section] || filters.section;
    const periodLabels: Record<string, string> = { ALL: 'الكل', today: 'اليوم', week: 'هذا الأسبوع', month: 'هذا الشهر', year: 'هذا العام' };
    const periodLabel = periodLabels[filters.period] || 'الكل';
    const typeLabels: Record<string, string> = { ALL: 'الكل (عملاء وموردون)', CUSTOMERS: 'العملاء فقط', SUPPLIERS: 'الموردون فقط' };
    const typeLabel = typeLabels[filters.type] || 'الكل';

    const customersRows = (data.customers || []).map((inv: any) => `
      <tr>
        <td>${inv.invoiceNumber}</td>
        <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
        <td>${inv.customer}</td>
        <td>${customerTypeLabels[inv.customerType] || inv.customerType}</td>
        <td>${inv.notes || '-'}</td>
        <td>${inv.items?.map((item: any) => {
          const qty = parseFloat(item.quantity);
          const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
          return `${item.itemName}(${formattedQty})`;
        }).join(' + ') || '-'}</td>
        <td>${formatCurrency(parseFloat(inv.total))}</td>
        <td>${formatCurrency(parseFloat(inv.paidAmount))}</td>
        <td>${formatCurrency(parseFloat(inv.outstanding))}</td>
        <td>${inv.payments?.map((p: any) => `${formatCurrency(parseFloat(p.amount))} (${paymentMethodLabels[p.method] || p.method}) - ${formatDate(p.paidAt)}`).join('<br>') || '-'}</td>
        <td>${paymentStatusLabels[inv.paymentStatus] || inv.paymentStatus}</td>
      </tr>
    `).join('');

    const suppliersRows = (data.suppliers || []).map((order: any) => `
      <tr>
        <td>${order.orderNumber}</td>
        <td>${new Date(order.date).toLocaleDateString('ar-EG')}</td>
        <td>${order.supplier}</td>
        <td>${order.notes || '-'}</td>
        <td>${order.items?.map((item: any) => {
          const qty = parseFloat(item.quantity);
          const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
          return `${item.itemName}(${formattedQty})`;
        }).join(' + ') || '-'}</td>
        <td>${formatCurrency(parseFloat(order.total))}</td>
        <td>${formatCurrency(parseFloat(order.paidAmount))}</td>
        <td>${formatCurrency(parseFloat(order.outstanding))}</td>
        <td>${order.payments?.map((p: any) => `${formatCurrency(parseFloat(p.amount))} (${paymentMethodLabels[p.method] || p.method}) - ${formatDate(p.paidAt)}`).join('<br>') || '-'}</td>
        <td>${order.paymentStatus === 'CONFIRMED' ? 'مؤكد' : 'معلق'}</td>
        <td>${procOrderStatusLabels[order.status] || order.status}</td>
      </tr>
    `).join('');

    const html = `
      <div class="header">
        <h1>تقرير المتأخرات المالية</h1>
        <div class="date">تاريخ التقرير: ${currentDate} | القسم: ${sectionLabel} | الفترة: ${periodLabel} | النوع: ${typeLabel}</div>
      </div>

      <div class="section">
        <h2>الملخص</h2>
        <table>
          <thead>
            <tr>
              <th>البند</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>عدد فواتير العملاء المتأخرة</td>
              <td>${data.summary.totalCustomersOutstanding || 0}</td>
            </tr>
            <tr>
              <td>العملاء مدينون لنا</td>
              <td>${formatCurrency(parseFloat(data.summary.customersOwesUs || '0'))}</td>
            </tr>
            <tr>
              <td>عدد أوامر الموردين المتأخرة</td>
              <td>${data.summary.totalSuppliersOutstanding || 0}</td>
            </tr>
            <tr>
              <td>نحن مدينون للموردين</td>
              <td>${formatCurrency(parseFloat(data.summary.weOweSuppliers || '0'))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${(filters.type === 'ALL' || filters.type === 'CUSTOMERS') && data.customers.length > 0 ? `
      <div class="section">
        <h2>العملاء المتأخرون (${data.customers.length})</h2>
        <table>
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>التاريخ</th>
              <th>العميل</th>
              <th>نوع العميل</th>
              <th>الوصف</th>
              <th>الأصناف</th>
              <th>الإجمالي</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
              <th>المدفوعات</th>
              <th>حالة الدفع</th>
            </tr>
          </thead>
          <tbody>
            ${customersRows}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${(filters.type === 'ALL' || filters.type === 'SUPPLIERS') && data.suppliers.length > 0 ? `
      <div class="section">
        <h2>الموردون المتأخرون (${data.suppliers.length})</h2>
        <table>
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>التاريخ</th>
              <th>المورد</th>
              <th>الوصف</th>
              <th>الأصناف</th>
              <th>الإجمالي</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
              <th>المدفوعات</th>
              <th>حالة الدفع</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${suppliersRows}
          </tbody>
        </table>
      </div>
      ` : ''}
    `;

    generatePDF(html, 'تقرير_المتأخرات');
  };

  const periodLabels: Record<string, string> = {
    ALL: 'الكل',
    today: 'اليوم',
    week: 'هذا الأسبوع',
    month: 'هذا الشهر',
    year: 'هذا العام',
  };

  const customerColumns = [
    { key: 'invoiceNumber', label: 'رقم الفاتورة' },
    { 
      key: 'date', 
      label: 'التاريخ',
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG')
    },
    { key: 'customer', label: 'العميل' },
    {
      key: 'customerType',
      label: 'نوع العميل',
      render: (value: string) => customerTypeLabels[value] || value
    },
    {
      key: 'notes',
      label: 'الوصف',
      render: (value: string | null) => value || '-'
    },
    {
      key: 'items',
      label: 'الأصناف',
      render: (value: any[], row: any) => {
        if (!value || value.length === 0) return '-';
        return value.map(item => {
          const qty = parseFloat(item.quantity);
          const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
          return `${item.itemName}(${formattedQty})`;
        }).join(' + ');
      }
    },
    { 
      key: 'total', 
      label: 'الإجمالي',
      render: (value: string) => formatCurrency(parseFloat(value))
    },
    { 
      key: 'paidAmount', 
      label: 'المدفوع',
      render: (value: string) => formatCurrency(parseFloat(value))
    },
    { 
      key: 'outstanding', 
      label: 'المتبقي',
      render: (value: string) => formatCurrency(parseFloat(value))
    },
    {
      key: 'payments',
      label: 'المدفوعات',
      render: (value: any[], row: any) => {
        if (!value || value.length === 0) return '-';
        return (
          <div className="space-y-1">
            {value.map((payment, index) => (
              <div key={index} className="text-sm">
                {formatCurrency(parseFloat(payment.amount))} ({paymentMethodLabels[payment.method] || payment.method}) - {formatDate(payment.paidAt)}
              </div>
            ))}
          </div>
        );
      }
    },
    { 
      key: 'paymentStatus', 
      label: 'حالة الدفع',
      render: (value: string) => paymentStatusLabels[value] || value
    },
  ];

  const supplierColumns = [
    { key: 'orderNumber', label: 'رقم الطلب' },
    { 
      key: 'date', 
      label: 'التاريخ',
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG')
    },
    { key: 'supplier', label: 'المورد' },
    {
      key: 'notes',
      label: 'الوصف',
      render: (value: string | null) => value || '-'
    },
    {
      key: 'items',
      label: 'الأصناف',
      render: (value: any[], row: any) => {
        if (!value || value.length === 0) return '-';
        return value.map(item => {
          const qty = parseFloat(item.quantity);
          const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
          return `${item.itemName}(${formattedQty})`;
        }).join(' + ');
      }
    },
    { 
      key: 'total', 
      label: 'الإجمالي',
      render: (value: string) => formatCurrency(parseFloat(value))
    },
    { 
      key: 'paidAmount', 
      label: 'المدفوع',
      render: (value: string) => formatCurrency(parseFloat(value))
    },
    { 
      key: 'outstanding', 
      label: 'المتبقي',
      render: (value: string) => formatCurrency(parseFloat(value))
    },
    {
      key: 'payments',
      label: 'المدفوعات',
      render: (value: any[], row: any) => {
        if (!value || value.length === 0) return '-';
        return (
          <div className="space-y-1">
            {value.map((payment, index) => (
              <div key={index} className="text-sm">
                {formatCurrency(parseFloat(payment.amount))} ({paymentMethodLabels[payment.method] || payment.method}) - {formatDate(payment.paidAt)}
              </div>
            ))}
          </div>
        );
      }
    },
    { 
      key: 'paymentStatus', 
      label: 'حالة الدفع',
      render: (value: string) => value === 'CONFIRMED' ? 'مؤكد' : 'معلق'
    },
    { 
      key: 'status', 
      label: 'الحالة',
      render: (value: string) => procOrderStatusLabels[value] || value
    },
  ];

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!data) {
    return <div className="text-center py-8">لا توجد بيانات</div>;
  }

  return (
    <div className="print:bg-white">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-3xl font-bold text-gray-900">تقرير المتأخرات المالية</h1>
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          🖨️ طباعة التقرير
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 print:hidden">
        <h2 className="text-xl font-semibold mb-4">مرشحات البحث</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            label="من تاريخ"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value, period: 'ALL' })}
          />
          <Input
            label="إلى تاريخ"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value, period: 'ALL' })}
          />
          <Select
            label="القسم"
            value={filters.section}
            onChange={(e) => setFilters({ ...filters, section: e.target.value })}
            options={[
              { value: 'ALL', label: 'الكل' },
              { value: 'GROCERY', label: 'بقالة' },
              { value: 'BAKERY', label: 'أفران' },
            ]}
          />
          <Select
            label="الفترة الزمنية"
            value={filters.period}
            onChange={(e) => {
              setFilters({ ...filters, period: e.target.value, startDate: '', endDate: '' });
            }}
            options={[
              { value: 'ALL', label: 'الكل' },
              { value: 'today', label: 'اليوم' },
              { value: 'week', label: 'هذا الأسبوع' },
              { value: 'month', label: 'هذا الشهر' },
              { value: 'year', label: 'هذا العام' },
            ]}
          />
          <Select
            label="النوع"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={[
              { value: 'ALL', label: 'الكل (عملاء وموردون)' },
              { value: 'CUSTOMERS', label: 'العملاء فقط' },
              { value: 'SUPPLIERS', label: 'الموردون فقط' },
            ]}
          />
        </div>
      </Card>

      {/* Summary */}
      {data.summary && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">الملخص</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">عدد فواتير العملاء المتأخرة</div>
              <div className="text-2xl font-bold">{data.summary.totalCustomersOutstanding || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">العملاء مدينون لنا</div>
              <div className="text-2xl font-bold text-red-700">
                {formatCurrency(parseFloat(data.summary.customersOwesUs || '0'))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">عدد أوامر الموردين المتأخرة</div>
              <div className="text-2xl font-bold">{data.summary.totalSuppliersOutstanding || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">نحن مدينون للموردين</div>
              <div className="text-2xl font-bold text-red-700">
                {formatCurrency(parseFloat(data.summary.weOweSuppliers || '0'))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Customers Outstanding */}
      {filters.type === 'ALL' || filters.type === 'CUSTOMERS' ? (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            العملاء المتأخرون ({data.customers.length})
          </h2>
          {data.customers.length > 0 ? (
            <Table columns={customerColumns} data={data.customers} />
          ) : (
            <p className="text-gray-500 text-center py-8">لا توجد متأخرات للعملاء</p>
          )}
        </Card>
      ) : null}

      {/* Suppliers Outstanding */}
      {filters.type === 'ALL' || filters.type === 'SUPPLIERS' ? (
        <Card>
          <h2 className="text-xl font-semibold mb-4">
            الموردون المتأخرون ({data.suppliers.length})
          </h2>
          {data.suppliers.length > 0 ? (
            <Table columns={supplierColumns} data={data.suppliers} />
          ) : (
            <p className="text-gray-500 text-center py-8">لا توجد متأخرات للموردين</p>
          )}
        </Card>
      ) : null}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background: white;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}

