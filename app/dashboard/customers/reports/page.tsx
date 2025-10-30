'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Table from '@/components/Table';
import { formatCurrency } from '@/lib/utils';

export default function CustomerReportPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    setLoading(true);
    try {
      const data = await api.getCustomerReport({
        startDate,
        endDate,
        type: type || undefined,
        customerId: customerId || undefined,
        paymentMethod: paymentMethod || undefined,
      });
      setReport(data.data || []);
      setSummary(data.summary || null);
    } catch (error: any) {
      alert(error.message || 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    const printSection = document.getElementById('customer-print-section');
    if (!printSection) return;

    const printContent = printSection.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>تقرير العملاء</title>
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
          <h1>تقرير العملاء</h1>
          <div class="summary">
            ${summary ? `
              <div><strong>إجمالي عدد الفواتير:</strong> ${summary.totalInvoices}</div>
              <div><strong>إجمالي المبيعات:</strong> ${formatCurrency(parseFloat(summary.totalSales))}</div>
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
      render: (value: string) => value === 'WHOLESALE' ? 'جملة' : value === 'RETAIL' ? 'قطاعي' : value
    },
    { 
      key: 'paymentMethod', 
      label: 'طريقة الدفع',
      render: (value: string) => {
        const methods: Record<string, string> = {
          'CASH': 'كاش',
          'BANK': 'بنكك',
          'BANK_NILE': 'بنك النيل'
        };
        return methods[value] || value;
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
      key: 'paymentStatus', 
      label: 'حالة الدفع',
      render: (value: string) => {
        const statuses: Record<string, string> = {
          'PAID': 'مدفوع',
          'PARTIAL': 'جزئي',
          'CREDIT': 'آجل'
        };
        return statuses[value] || value;
      }
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">تقرير العملاء</h1>
        <Button variant="secondary" onClick={() => router.back()}>
          رجوع
        </Button>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
          <Select
            label="نوع العميل"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: '', label: 'الكل' },
              { value: 'WHOLESALE', label: 'جملة' },
              { value: 'RETAIL', label: 'قطاعي' },
            ]}
          />
          <Select
            label="العميل"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            options={[
              { value: '', label: 'الكل' },
              ...customers.map((c) => ({ value: c.id, label: c.name })),
            ]}
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
          <div className="md:col-span-5 flex gap-2">
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

      {summary && (
        <Card className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">إجمالي عدد الفواتير</div>
              <div className="text-2xl font-bold">{summary.totalInvoices}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">إجمالي المبيعات</div>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(summary.totalSales))}</div>
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

      <div id="customer-print-section">
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

