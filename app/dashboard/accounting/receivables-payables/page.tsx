'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/Card';
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
          {/* Main Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <h3 className="text-lg font-semibold mb-2">إجمالي له (العملاء)</h3>
              <p className="text-3xl font-bold">{formatCurrency(parseFloat(data?.totals?.receivables || '0'))}</p>
              <p className="text-sm mt-2 opacity-90">{data?.receivables?.length || 0} عميل</p>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <h3 className="text-lg font-semibold mb-2">إجمالي عليه (الموردين)</h3>
              <p className="text-3xl font-bold">{formatCurrency(parseFloat(data?.totals?.payables || '0'))}</p>
              <p className="text-sm mt-2 opacity-90">{data?.payables?.length || 0} مورد</p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <h3 className="text-lg font-semibold mb-2">إجمالي عليه (شامل المنصرفات)</h3>
              <p className="text-3xl font-bold">{formatCurrency(parseFloat(data?.totals?.payablesWithExpenses || data?.totals?.payables || '0'))}</p>
              <p className="text-sm mt-2 opacity-90">بما في ذلك جميع المنصرفات</p>
            </Card>
          </div>

          {/* Comprehensive Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-right text-base font-bold text-gray-900 border-b-2 border-gray-300" colSpan={4}>
                      له (العملاء - الذمم المدينة)
                    </th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">العميل</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">الإجمالي</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">المدفوع</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">المتبقي</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.receivables?.length > 0 ? (
                    data.receivables.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-green-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{item.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(parseFloat(item.total))}</td>
                        <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(parseFloat(item.paid))}</td>
                        <td className="px-6 py-3 text-sm font-bold text-green-700">{formatCurrency(parseFloat(item.remaining))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">لا توجد ذمم مدينة</td>
                    </tr>
                  )}
                  <tr className="bg-green-100 font-bold">
                    <td className="px-6 py-4 text-sm text-gray-900">إجمالي له (العملاء)</td>
                    <td className="px-6 py-4 text-sm text-gray-900" colSpan={3}>{formatCurrency(parseFloat(data?.totals?.receivables || '0'))}</td>
                  </tr>
                </tbody>

                <thead className="bg-gray-100 border-t-4 border-gray-400">
                  <tr>
                    <th className="px-6 py-4 text-right text-base font-bold text-gray-900 border-b-2 border-gray-300" colSpan={4}>
                      عليه (الموردين - الذمم الدائنة)
                    </th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">المورد</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">الإجمالي</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">المدفوع</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 border-b border-gray-200">المتبقي</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.payables?.length > 0 ? (
                    data.payables.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-red-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{item.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(parseFloat(item.total))}</td>
                        <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(parseFloat(item.paid))}</td>
                        <td className="px-6 py-3 text-sm font-bold text-red-700">{formatCurrency(parseFloat(item.remaining))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">لا توجد ذمم دائنة</td>
                    </tr>
                  )}
                  <tr className="bg-red-100 font-bold border-t-2 border-gray-300">
                    <td className="px-6 py-4 text-sm text-gray-900">إجمالي عليه (الموردين)</td>
                    <td className="px-6 py-4 text-sm text-gray-900" colSpan={3}>{formatCurrency(parseFloat(data?.totals?.payables || '0'))}</td>
                  </tr>
                </tbody>

                <thead className="bg-gray-100 border-t-4 border-gray-400">
                  <tr>
                    <th className="px-6 py-4 text-right text-base font-bold text-gray-900 border-b-2 border-gray-300" colSpan={4}>
                      المنصرفات الإضافية
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-orange-50">
                    <td className="px-6 py-3 text-sm text-gray-900">المنصرفات التشغيلية</td>
                    <td className="px-6 py-3 text-sm text-gray-700" colSpan={3}>{formatCurrency(parseFloat(data?.expenses?.regular || '0'))}</td>
                  </tr>
                  <tr className="hover:bg-orange-50">
                    <td className="px-6 py-3 text-sm text-gray-900">المرتبات</td>
                    <td className="px-6 py-3 text-sm text-gray-700" colSpan={3}>{formatCurrency(parseFloat(data?.expenses?.salaries || '0'))}</td>
                  </tr>
                  <tr className="hover:bg-orange-50">
                    <td className="px-6 py-3 text-sm text-gray-900">السلفيات</td>
                    <td className="px-6 py-3 text-sm text-gray-700" colSpan={3}>{formatCurrency(parseFloat(data?.expenses?.advances || '0'))}</td>
                  </tr>
                  <tr className="bg-orange-100 font-bold border-t-2 border-gray-300">
                    <td className="px-6 py-4 text-sm text-gray-900">إجمالي المنصرفات</td>
                    <td className="px-6 py-4 text-sm text-gray-900" colSpan={3}>{formatCurrency(parseFloat(data?.expenses?.total || '0'))}</td>
                  </tr>
                </tbody>

                <tfoot className="bg-gradient-to-r from-purple-100 to-purple-200 border-t-4 border-purple-500">
                  <tr>
                    <td className="px-6 py-5 text-lg font-bold text-purple-900">إجمالي عليه (شامل المنصرفات)</td>
                    <td className="px-6 py-5 text-lg font-bold text-purple-900" colSpan={3}>
                      {formatCurrency(parseFloat(data?.totals?.payablesWithExpenses || data?.totals?.payables || '0'))}
                    </td>
                  </tr>
                  <tr className="bg-gradient-to-r from-blue-100 to-blue-200">
                    <td className="px-6 py-5 text-lg font-bold text-blue-900">الصافي (له - عليه)</td>
                    <td className="px-6 py-5 text-lg font-bold text-blue-900" colSpan={3}>
                      {formatCurrency(
                        parseFloat(data?.totals?.receivables || '0') - 
                        parseFloat(data?.totals?.payablesWithExpenses || data?.totals?.payables || '0')
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}


