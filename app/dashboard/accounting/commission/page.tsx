'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { formatCurrency, formatDateTime, sectionLabels } from '@/lib/utils';
import { ensureAggregatorsUpdated } from '@/lib/aggregatorUtils';

export default function CommissionReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    supplierId: '',
    inventoryId: '',
    section: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.supplierId) params.supplierId = filters.supplierId;
      if (filters.inventoryId) params.inventoryId = filters.inventoryId;
      if (filters.section) params.section = filters.section;
      
      // Ensure aggregators are updated before loading report
      await ensureAggregatorsUpdated(filters.startDate, filters.endDate, {
        inventoryId: filters.inventoryId || undefined,
        section: filters.section || undefined,
        silent: true,
      });
      
      const res = await api.getCommissionReport(params);
      setData(res);
    } catch (e: any) {
      alert(e.message || 'فشل تحميل تقرير العمولات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">تقرير العمولات (سداد الموردين)</h1>
        <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">تحديث</Button>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">مرشحات</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
            <select
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">الكل</option>
              <option value="GROCERY">بقالة</option>
              <option value="BAKERY">أفران</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button onClick={loadData} className="w-full">تطبيق</Button>
          </div>
        </div>
      </Card>

      {data ? (
        <div className="grid gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-2">الملخص</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded">
                <div className="text-gray-600">إجمالي العمولات</div>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(parseFloat(data.summary.total || '0'))}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-600">عدد المعاملات</div>
                <div className="text-2xl font-bold text-blue-700">{data.summary.count}</div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">تفاصيل حسب التاريخ</h3>
            {Object.keys(data.breakdown.byDate).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">التاريخ</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">المبلغ</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">العدد</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries<any>(data.breakdown.byDate).map(([dateKey, v]) => (
                      <tr key={dateKey}>
                        <td className="px-4 py-2 text-sm">{new Date(dateKey).toLocaleDateString('ar-SD')}</td>
                        <td className="px-4 py-2 text-sm font-semibold">{formatCurrency(parseFloat(v.amount))}</td>
                        <td className="px-4 py-2 text-sm">{v.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500">لا توجد بيانات</div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">تفاصيل حسب المورد</h3>
            {Object.keys(data.breakdown.bySupplier).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">المورد</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">المبلغ</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">العدد</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries<any>(data.breakdown.bySupplier).map(([id, v]) => (
                      <tr key={id}>
                        <td className="px-4 py-2 text-sm">{v.name}</td>
                        <td className="px-4 py-2 text-sm font-semibold">{formatCurrency(parseFloat(v.amount))}</td>
                        <td className="px-4 py-2 text-sm">{v.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500">لا توجد بيانات</div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-3">جميع المعاملات</h3>
            {data.rows && data.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">التاريخ</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">المبلغ</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">الأمر</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">المورد</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">المخزن</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">القسم</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">سجل بواسطة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.rows.map((r: any) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2 text-sm">{r.date ? formatDateTime(r.date) : '-'}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-green-700">{formatCurrency(parseFloat(r.amount))}</td>
                        <td className="px-4 py-2 text-sm">{r.orderNumber || r.orderId}</td>
                        <td className="px-4 py-2 text-sm">{r.supplier || '-'}</td>
                        <td className="px-4 py-2 text-sm">{r.inventory || '-'}</td>
                        <td className="px-4 py-2 text-sm">{r.section ? sectionLabels[r.section] : '-'}</td>
                        <td className="px-4 py-2 text-sm">{r.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500">لا توجد معاملات</div>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>
        </Card>
      )}
    </div>
  );
}


