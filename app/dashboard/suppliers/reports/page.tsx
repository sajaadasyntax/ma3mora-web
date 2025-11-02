'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import MultiSelect from '@/components/MultiSelect';
import Table from '@/components/Table';
import { formatCurrency, formatDate, formatNumber, paymentMethodLabels } from '@/lib/utils';
import StockInfoTable from '@/components/StockInfoTable';
import { ensureAggregatorsUpdated } from '@/lib/aggregatorUtils';

export default function SupplierReportPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplierIds, setSupplierIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [stockInfo, setStockInfo] = useState<any | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    setLoading(true);
    try {
      // Ensure dates are properly formatted
      const params: any = {
        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : undefined,
        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : undefined,
      };
      if (supplierIds.length > 0) params.supplierIds = supplierIds.join(',');
      if (paymentMethod) params.paymentMethod = paymentMethod;

      // Ensure aggregators are updated before loading report
      await ensureAggregatorsUpdated(startDate, endDate, { silent: true });
      
      const data = await api.getSupplierReport(params);
      setReport(data?.data || []);
      setSummary(data?.summary || null);
      setStockInfo(data?.stockInfo || null);
    } catch (error: any) {
      console.error('Error fetching supplier report:', error);
      alert(error?.error || error?.message || 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    const printSection = document.getElementById('supplier-print-section');
    if (!printSection) return;

    const printContent = printSection.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>تقرير الموردين</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            .summary { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .summary div { margin: 5px 0; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>تقرير الموردين</h1>
          <div class="summary">
            ${summary ? `
              <div><strong>إجمالي عدد الطلبات:</strong> ${summary.totalOrders}</div>
              <div><strong>إجمالي المشتريات:</strong> ${formatCurrency(parseFloat(summary.totalPurchases))}</div>
              <div><strong>إجمالي المدفوع:</strong> ${formatCurrency(parseFloat(summary.totalPaid))}</div>
              <div><strong>إجمالي المتبقي:</strong> ${formatCurrency(parseFloat(summary.totalOutstanding))}</div>
            ` : ''}
          </div>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const columns = [
    { key: 'orderNumber', label: 'رقم الطلب' },
    { 
      key: 'date', 
      label: 'التاريخ',
      render: (value: string) => new Date(value).toLocaleDateString('ar-EG')
    },
    { key: 'supplier', label: 'المورد' },
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
      render: (value: string) => value === 'CONFIRMED' ? 'مؤكد' : 'معلق'
    },
    { 
      key: 'status', 
      label: 'الحالة',
      render: (value: string) => {
        const statuses: Record<string, string> = {
          'PENDING': 'معلق',
          'RECEIVED': 'مستلم',
          'PARTIAL': 'جزئي',
          'CANCELLED': 'ملغي'
        };
        return statuses[value] || value;
      }
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">تقرير الموردين</h1>
        <Button variant="secondary" onClick={() => router.back()}>
          رجوع
        </Button>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Input
            label="من تاريخ"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="إلى تاريخ"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <MultiSelect
            label="الموردين"
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            selectedValues={supplierIds}
            onChange={setSupplierIds}
          />
          <Select
            label="طريقة الدفع"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: '', label: 'الكل' },
              { value: 'CASH', label: 'كاش' },
              { value: 'BANK', label: 'بنكك' },
              { value: 'BANK_NILE', label: 'بنك النيل' },
            ]}
          />
          <div className="md:col-span-4 flex gap-2">
            <Button onClick={fetchReport} disabled={loading}>
              {loading ? 'جاري التحميل...' : 'عرض التقرير'}
            </Button>
            {report.length > 0 && (
              <Button variant="secondary" onClick={printReport}>
                طباعة التقرير
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stock Information Summary */}
      {stockInfo && <StockInfoTable stockInfo={stockInfo} />}

      {summary && (
        <Card className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">إجمالي عدد الطلبات</div>
              <div className="text-2xl font-bold">{summary.totalOrders}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">إجمالي المشتريات</div>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(summary.totalPurchases))}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">إجمالي المدفوع</div>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(summary.totalPaid))}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">إجمالي المتبقي</div>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(summary.totalOutstanding))}</div>
            </div>
          </div>
        </Card>
      )}

      <div id="supplier-print-section">
        <Card>
          {report.length > 0 ? (
            <Table columns={columns} data={report} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'جاري التحميل...' : 'لا توجد بيانات لعرضها. يرجى تحديد الفلاتر وعرض التقرير.'}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

