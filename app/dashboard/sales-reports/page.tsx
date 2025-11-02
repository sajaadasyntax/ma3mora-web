'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Input from '@/components/Input';
import { formatCurrency, formatDate, formatDateTime, formatNumber, paymentMethodLabels, sectionLabels } from '@/lib/utils';
import { generateSalesReportPDF } from '@/lib/pdfUtils';
import StockInfoTable from '@/components/StockInfoTable';
import Table from '@/components/Table';
import { ensureAggregatorsUpdated } from '@/lib/aggregatorUtils';

export default function SalesReportsPage() {
  const { user } = useUser();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [inventories, setInventories] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'daily',
    inventoryId: '',
    section: '',
    paymentMethod: '',
    viewType: 'invoices', // 'invoices' for invoice-level, 'grouped' for period grouping
  });

  useEffect(() => {
    loadInventories();
  }, []);

  useEffect(() => {
    loadReports();
  }, []);

  const loadInventories = async () => {
    try {
      const data = await api.getInventories();
      setInventories(data);
    } catch (error) {
      console.error('Error loading inventories:', error);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const params: any = {};
      let dateStart: string | null = null;
      let dateEnd: string | null = null;
      
      if (filters.period === 'monthly') {
        // Expect startDate as YYYY-MM when monthly; compute endDate as month end
        if (filters.startDate) {
          const [year, month] = filters.startDate.split('-');
          const end = new Date(Number(year), Number(month), 0); // last day of month
          const startISO = `${year}-${month}-01`;
          const endISO = end.toISOString().split('T')[0];
          params.startDate = startISO;
          params.endDate = endISO;
          dateStart = startISO;
          dateEnd = endISO;
        }
        params.period = 'monthly';
      } else {
        if (filters.startDate) {
          params.startDate = filters.startDate;
          dateStart = filters.startDate;
        }
        if (filters.endDate) {
          params.endDate = filters.endDate;
          dateEnd = filters.endDate;
        }
        if (filters.period) params.period = filters.period;
      }
      if (filters.inventoryId) params.inventoryId = filters.inventoryId;
      if (filters.section) params.section = filters.section;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.viewType) params.viewType = filters.viewType;

      // Ensure aggregators are updated before loading report
      await ensureAggregatorsUpdated(dateStart, dateEnd, {
        inventoryId: filters.inventoryId || undefined,
        section: filters.section || undefined,
        silent: true,
      });

      const data = await api.getSalesReports(params);
      setReportData(data);
    } catch (error) {
      console.error('Error loading sales reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    // When switching period, normalize date inputs
    if (key === 'period') {
      if (value === 'monthly') {
        // Clear endDate; startDate will be month (YYYY-MM)
        setFilters(prev => ({ ...prev, period: value, endDate: '' }));
        return;
      } else {
        setFilters(prev => ({ ...prev, period: value }));
        return;
      }
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadReports();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      period: 'daily',
      inventoryId: '',
      section: '',
      paymentMethod: '',
      viewType: 'invoices',
    });
    loadReports();
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-3xl font-bold text-gray-900">تقارير المبيعات</h1>
        <Button onClick={() => generateSalesReportPDF(reportData, filters)}>
          طباعة
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {filters.period === 'monthly' ? 'الشهر' : 'تاريخ البداية'}
            </label>
            <Input
              type={filters.period === 'monthly' ? 'month' : 'date'}
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          {filters.period !== 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ النهاية
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفترة
            </label>
            <Select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              options={[
                { value: 'daily', label: 'يومي' },
                { value: 'monthly', label: 'شهري' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المخزن
            </label>
            <Select
              value={filters.inventoryId}
              onChange={(e) => handleFilterChange('inventoryId', e.target.value)}
              options={[
                { value: '', label: 'جميع المخازن' },
                ...inventories.map((inv) => ({ value: inv.id, label: inv.name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              القسم
            </label>
            <Select
              value={filters.section}
              onChange={(e) => handleFilterChange('section', e.target.value)}
              options={[
                { value: '', label: 'جميع الأقسام' },
                { value: 'GROCERY', label: 'بقالات' },
                { value: 'BAKERY', label: 'أفران' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              طريقة الدفع
            </label>
            <Select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              options={[
                { value: '', label: 'جميع الطرق' },
                { value: 'CASH', label: paymentMethodLabels.CASH },
                { value: 'BANK', label: paymentMethodLabels.BANK },
                { value: 'BANK_NILE', label: paymentMethodLabels.BANK_NILE },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع العرض
            </label>
            <Select
              value={filters.viewType}
              onChange={(e) => handleFilterChange('viewType', e.target.value)}
              options={[
                { value: 'invoices', label: 'تفاصيل الفواتير' },
                { value: 'grouped', label: 'مجمعة حسب الفترة' },
              ]}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleApplyFilters} className="flex-1">
              تطبيق
            </Button>
            <Button onClick={handleResetFilters} variant="secondary" className="flex-1">
              إعادة تعيين
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary */}
      {reportData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reportData.summary.totalInvoices}
              </div>
              <div className="text-sm text-gray-600">إجمالي الفواتير</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.summary.totalSales)}
              </div>
              <div className="text-sm text-gray-600">إجمالي المبيعات</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(reportData.summary.totalPaid)}
              </div>
              <div className="text-sm text-gray-600">المحصل</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(reportData.summary.totalOutstanding)}
              </div>
              <div className="text-sm text-gray-600">المتبقي</div>
            </div>
          </Card>
        </div>
      )}

      {/* Stock Information Summary */}
      {reportData?.stockInfo && <StockInfoTable stockInfo={reportData.stockInfo} />}

      {/* Report Data */}
      {reportData?.data && (
        <div className="space-y-6">
          {/* Check if data is invoice-level (has invoiceNumber) */}
          {reportData.data.length > 0 && reportData.data[0]?.invoiceNumber ? (
            // Invoice-level report (similar to supplier report)
            <Card>
              <Table
                columns={[
                  { key: 'invoiceNumber', label: 'رقم الفاتورة' },
                  { 
                    key: 'date', 
                    label: 'التاريخ',
                    render: (value: string) => new Date(value).toLocaleDateString('ar-EG')
                  },
                  { key: 'customer', label: 'العميل' },
                  { key: 'inventory', label: 'المخزن' },
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
                        // Format quantity: remove trailing zeros if whole number, otherwise show decimals
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
                    render: (value: string) => {
                      const statuses: Record<string, string> = {
                        'PAID': 'مدفوعة',
                        'PARTIAL': 'مدفوعة جزئياً',
                        'CREDIT': 'دفع آجل'
                      };
                      return (
                        <span className={`inline-block px-2 py-1 rounded text-sm ${
                          value === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : value === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {statuses[value] || value}
                        </span>
                      );
                    }
                  },
                  { 
                    key: 'deliveryStatus', 
                    label: 'حالة التسليم',
                    render: (value: string) => {
                      const statuses: Record<string, string> = {
                        'DELIVERED': 'مُسلَّمة',
                        'PARTIAL': 'تسليم جزئي',
                        'NOT_DELIVERED': 'غير مُسلَّمة'
                      };
                      return (
                        <span className={`inline-block px-2 py-1 rounded text-sm ${
                          value === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : value === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {statuses[value] || value}
                        </span>
                      );
                    }
                  },
                  { 
                    key: 'paymentConfirmed', 
                    label: 'تأكيد الدفع',
                    render: (value: boolean) => (
                      <span className={`inline-block px-2 py-1 rounded text-sm ${
                        value ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {value ? '✓ مؤكد' : '⏳ معلق'}
                      </span>
                    )
                  },
                ]}
                data={reportData.data}
              />
            </Card>
          ) : reportData.data.length > 0 && reportData.data[0]?.itemName ? (
            // Item-level report (stock movements) - Strict column format
            <Card>
              <Table
                columns={[
                  {
                    key: 'serial',
                    label: 'ترقيم',
                    render: (_: any, row: any, index?: number) => (index !== undefined ? index + 1 : '-')
                  },
                  { 
                    key: 'itemName', 
                    label: 'الصنف' 
                  },
                  {
                    key: 'openingBalance',
                    label: 'رصيد افتتاحي',
                    render: (value: number) => {
                      const val = typeof value === 'string' ? parseFloat(value) : value;
                      return val % 1 === 0 ? val.toString() : val.toFixed(2).replace(/\.?0+$/, '');
                    }
                  },
                  {
                    key: 'outgoing',
                    label: 'منصرف',
                    render: (value: number) => {
                      const val = typeof value === 'string' ? parseFloat(value) : value;
                      return val % 1 === 0 ? val.toString() : val.toFixed(2).replace(/\.?0+$/, '');
                    }
                  },
                  {
                    key: 'outgoingGifts',
                    label: 'هدية منصرف',
                    render: (value: number) => {
                      const val = typeof value === 'string' ? parseFloat(value) : value;
                      return val % 1 === 0 ? val.toString() : val.toFixed(2).replace(/\.?0+$/, '');
                    }
                  },
                  {
                    key: 'incoming',
                    label: 'وارد',
                    render: (value: number) => {
                      const val = typeof value === 'string' ? parseFloat(value) : value;
                      return val % 1 === 0 ? val.toString() : val.toFixed(2).replace(/\.?0+$/, '');
                    }
                  },
                  {
                    key: 'incomingGifts',
                    label: 'هدية وارد',
                    render: (value: number) => {
                      const val = typeof value === 'string' ? parseFloat(value) : value;
                      return val % 1 === 0 ? val.toString() : val.toFixed(2).replace(/\.?0+$/, '');
                    }
                  },
                  {
                    key: 'closingBalance',
                    label: 'رصيد ختامي',
                    render: (value: number) => {
                      const val = typeof value === 'string' ? parseFloat(value) : value;
                      return val % 1 === 0 ? val.toString() : val.toFixed(2).replace(/\.?0+$/, '');
                    }
                  },
                ]}
                data={reportData.data}
              />
            </Card>
          ) : (
            // Period-grouped report (invoices by date/month)
            reportData.data.map((periodData: any, index: number) => (
            <Card key={index}>
              <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {filters.period === 'daily' 
                    ? formatDateTime(periodData.date)
                    : `${periodData.month}`
                  }
                </h3>
                <div className="flex gap-6 mt-2 text-sm text-gray-600">
                  <span>عدد الفواتير: {periodData.invoiceCount}</span>
                  <span>إجمالي المبيعات: {formatCurrency(periodData.totalSales)}</span>
                  <span>المحصل: {formatCurrency(periodData.totalPaid)}</span>
                </div>
              </div>

              {/* Payment Methods Summary */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-3">طرق الدفع</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(periodData.paymentMethods).map(([method, data]: [string, any]) => (
                    <div key={method} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium">{paymentMethodLabels[method]}</div>
                      <div className="text-sm text-gray-600">
                        {data.count} فاتورة - {formatCurrency(data.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Summary */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-3">الأصناف المباعة</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الصنف
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الكمية
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          سعر الوحدة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الإجمالي
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(periodData.items).map(([itemName, itemData]: [string, any]) => (
                        <tr key={itemName}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {itemName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {itemData.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(itemData.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(itemData.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Invoices */}
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-3">تفاصيل الفواتير</h4>
                <div className="space-y-2">
                  {periodData.invoices.map((invoice: any) => (
                    <div key={invoice.id} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-600">
                            العميل: {invoice.customer?.name || 'بدون عميل'} | 
                            المخزن: {invoice.inventory?.name || 'غير محدد'} |
                            طريقة الدفع: {paymentMethodLabels[invoice.paymentMethod]}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(invoice.total)}</div>
                          <div className="text-sm text-gray-600">
                            {formatDateTime(invoice.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))
          )}
        </div>
      )}

      {reportData?.data?.length === 0 && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات للفترة المحددة
          </div>
        </Card>
      )}
    </div>
  );
}
