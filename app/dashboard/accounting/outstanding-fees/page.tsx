'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { formatCurrency, sectionLabels, customerTypeLabels } from '@/lib/utils';

export default function OutstandingFeesPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filters, setFilters] = useState({
    section: 'ALL',
    period: 'ALL',
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
      if (filters.period !== 'ALL') {
        params.period = filters.period;
      }
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
    window.print();
  };

  const periodLabels: Record<string, string> = {
    ALL: 'الكل',
    today: 'اليوم',
    week: 'هذا الأسبوع',
    month: 'هذا الشهر',
    year: 'هذا العام',
  };

  const customerColumns = [
    {
      key: 'name',
      label: 'اسم العميل',
    },
    {
      key: 'type',
      label: 'النوع',
      render: (value: string) => customerTypeLabels[value] || value,
    },
    {
      key: 'division',
      label: 'القسم',
      render: (value: string) => sectionLabels[value] || value,
    },
    {
      key: 'accountsReceivable',
      label: 'الذمم المدينة (من الفواتير)',
      render: (value: string) => formatCurrency(parseFloat(value)),
    },
    {
      key: 'openingBalance',
      label: 'رصيد افتتاحي',
      render: (value: string) => {
        const val = parseFloat(value);
        return (
          <span className={val !== 0 ? (val > 0 ? 'text-orange-600' : 'text-purple-600') : ''}>
            {val !== 0 && (val > 0 ? '+' : '')}{formatCurrency(val)}
          </span>
        );
      },
    },
    {
      key: 'netOutstanding',
      label: 'المتبقي الإجمالي',
      render: (value: string, row: any) => {
        const val = parseFloat(value);
        return (
          <div>
            <div className={`font-bold ${
              val > 0 ? 'text-red-700' : val < 0 ? 'text-orange-700' : 'text-gray-700'
            }`}>
              {formatCurrency(Math.abs(val))}
            </div>
            <div className="text-xs text-gray-500">
              {val > 0 ? 'العميل مدين لنا' : val < 0 ? 'نحن مدينون للعميل' : 'متساوي'}
            </div>
          </div>
        );
      },
    },
  ];

  const supplierColumns = [
    {
      key: 'name',
      label: 'اسم المورد',
    },
    {
      key: 'accountsPayable',
      label: 'الذمم الدائنة (من الأوامر)',
      render: (value: string) => formatCurrency(parseFloat(value)),
    },
    {
      key: 'openingBalance',
      label: 'رصيد افتتاحي',
      render: (value: string) => {
        const val = parseFloat(value);
        return (
          <span className={val !== 0 ? (val > 0 ? 'text-purple-600' : 'text-orange-600') : ''}>
            {val !== 0 && (val > 0 ? '+' : '')}{formatCurrency(val)}
          </span>
        );
      },
    },
    {
      key: 'netOutstanding',
      label: 'المتبقي الإجمالي',
      render: (value: string, row: any) => {
        const val = parseFloat(value);
        return (
          <div>
            <div className={`font-bold ${
              val > 0 ? 'text-red-700' : val < 0 ? 'text-orange-700' : 'text-gray-700'
            }`}>
              {formatCurrency(Math.abs(val))}
            </div>
            <div className="text-xs text-gray-500">
              {val > 0 ? 'نحن مدينون للمورد' : val < 0 ? 'المورد مدين لنا' : 'متساوي'}
            </div>
          </div>
        );
      },
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
        <div className="grid grid-cols-2 gap-4">
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
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            options={[
              { value: 'ALL', label: 'الكل' },
              { value: 'today', label: 'اليوم' },
              { value: 'week', label: 'هذا الأسبوع' },
              { value: 'month', label: 'هذا الشهر' },
              { value: 'year', label: 'هذا العام' },
            ]}
          />
        </div>
      </Card>

      {/* Summary */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">الملخص</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-1">العملاء مدينون لنا</p>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(parseFloat(data.summary.customersOwesUs))}
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-gray-600 mb-1">نحن مدينون للعملاء</p>
            <p className="text-2xl font-bold text-orange-700">
              {formatCurrency(parseFloat(data.summary.weOweCustomers))}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-1">نحن مدينون للموردين</p>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(parseFloat(data.summary.weOweSuppliers))}
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-gray-600 mb-1">الموردون مدينون لنا</p>
            <p className="text-2xl font-bold text-orange-700">
              {formatCurrency(parseFloat(data.summary.suppliersOwesUs))}
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-gray-700 mb-1">صافي المتبقي</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(
              parseFloat(data.summary.customersOwesUs) +
              parseFloat(data.summary.suppliersOwesUs) -
              parseFloat(data.summary.weOweCustomers) -
              parseFloat(data.summary.weOweSuppliers)
            )}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {(parseFloat(data.summary.customersOwesUs) +
              parseFloat(data.summary.suppliersOwesUs) -
              parseFloat(data.summary.weOweCustomers) -
              parseFloat(data.summary.weOweSuppliers)) > 0
              ? 'إجمالي ما هو مستحق لنا'
              : 'إجمالي ما هو مستحق منا'}
          </p>
        </div>
      </Card>

      {/* Customers Outstanding */}
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

      {/* Suppliers Outstanding */}
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

