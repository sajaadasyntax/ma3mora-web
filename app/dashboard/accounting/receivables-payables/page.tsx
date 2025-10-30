'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import Table from '@/components/Table';
import { api } from '@/lib/api';
import { formatCurrency, sectionLabels } from '@/lib/utils';

export default function ReceivablesPayablesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [section, setSection] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getReceivablesPayables(section ? { section } : undefined);
      setData(res);
    } catch (e) {
      console.error(e);
      alert('فشل تحميل تقرير له و عليه');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const receivableCols = [
    { key: 'name', label: 'العميل' },
    { key: 'total', label: 'الإجمالي', render: (v: any) => formatCurrency(parseFloat(v)) },
    { key: 'paid', label: 'المدفوع', render: (v: any) => formatCurrency(parseFloat(v)) },
    { key: 'remaining', label: 'المتبقي', render: (v: any) => (<span className="text-red-600 font-semibold">{formatCurrency(parseFloat(v))}</span>) },
  ];

  const payableCols = [
    { key: 'name', label: 'المورد' },
    { key: 'total', label: 'الإجمالي', render: (v: any) => formatCurrency(parseFloat(v)) },
    { key: 'paid', label: 'المدفوع', render: (v: any) => formatCurrency(parseFloat(v)) },
    { key: 'remaining', label: 'المتبقي', render: (v: any) => (<span className="text-blue-700 font-semibold">{formatCurrency(parseFloat(v))}</span>) },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">تقرير له و عليه</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">القسم</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            <option value="">الكل</option>
            <option value="GROCERY">{sectionLabels.GROCERY}</option>
            <option value="BAKERY">{sectionLabels.BAKERY}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title={`العملاء (له) — الإجمالي: ${formatCurrency(parseFloat(data?.totals?.receivables || '0'))}`}>
            {data?.receivables?.length ? (
              <Table columns={receivableCols} data={data.receivables} />
            ) : (
              <div className="text-center text-gray-500 py-8">لا توجد ذمم مدينة</div>
            )}
          </Card>

          <Card title={`الموردون (عليه) — الإجمالي: ${formatCurrency(parseFloat(data?.totals?.payablesWithExpenses || data?.totals?.payables || '0'))}`}>
            {data?.payables?.length ? (
              <Table columns={payableCols} data={data.payables} />
            ) : (
              <div className="text-center text-gray-500 py-8">لا توجد ذمم دائنة</div>
            )}
          </Card>
        </div>

        {/* Expenses breakdown contributing to (عليه) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">تفاصيل المنصرفات المضافة إلى (عليه)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">المنصرفات التشغيلية</span>
                <span className="font-semibold">{formatCurrency(parseFloat(data?.expenses?.regular || '0'))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">المرتبات</span>
                <span className="font-semibold">{formatCurrency(parseFloat(data?.expenses?.salaries || '0'))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">السلفيات</span>
                <span className="font-semibold">{formatCurrency(parseFloat(data?.expenses?.advances || '0'))}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex items-center justify-between">
                <span className="text-gray-900 font-semibold">إجمالي المنصرفات</span>
                <span className="text-gray-900 font-bold">{formatCurrency(parseFloat(data?.expenses?.total || '0'))}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">ملخص الإجماليات</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">إجمالي العملاء (له)</span>
                <span className="font-semibold">{formatCurrency(parseFloat(data?.totals?.receivables || '0'))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">إجمالي الموردين (عليه) بدون منصرفات</span>
                <span className="font-semibold">{formatCurrency(parseFloat(data?.totals?.payables || '0'))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-semibold">إجمالي (عليه) شامل المنصرفات</span>
                <span className="text-gray-900 font-bold">{formatCurrency(parseFloat(data?.totals?.payablesWithExpenses || data?.totals?.payables || '0'))}</span>
              </div>
            </div>
          </Card>
        </div>
        </>
      )}
    </>
  );
}


