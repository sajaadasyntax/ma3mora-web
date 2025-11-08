'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { formatCurrency, formatDateTime, paymentMethodLabels } from '@/lib/utils';

export default function AssetsLiabilitiesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.getAssetsLiabilities();
      setData(response);
    } catch (error) {
      console.error('Error loading assets-liabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!data) {
    return <div className="text-center py-8">خطأ في تحميل البيانات</div>;
  }

  // Prepare assets data for table
  const assetsRows = [
    ...(data.assets.stockValues.byWarehouse || []).map((w: any) => ({
      label: `المخزن: ${w.inventoryName}`,
      value: parseFloat(w.totalValue),
    })),
    {
      label: 'رصيد الخزينة (كاش)',
      value: parseFloat(data.assets.liquidCash.CASH),
    },
    {
      label: 'رصيد بنكك',
      value: parseFloat(data.assets.liquidCash.BANK),
    },
    {
      label: 'رصيد بنك النيل',
      value: parseFloat(data.assets.liquidCash.BANK_NILE),
    },
    {
      label: 'الديون الواردة (لنا)',
      value: parseFloat(data.assets.inboundDebts.total),
    },
    ...(data.assets.deliveredUnpaidSales.byWarehouse || []).map((w: any) => ({
      label: `مديونية ${w.inventoryName}`,
      value: parseFloat(w.totalOutstanding),
    })),
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">له و عليه</h1>
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/accounting')}
        >
          العودة للمحاسبة
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* له (Assets) */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            له
          </h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-bold text-gray-700">الوصف</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-bold text-gray-700">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {assetsRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-right text-sm text-gray-900">{row.label}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(row.value)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-green-50 font-bold">
                    <td className="border border-gray-300 px-4 py-3 text-right text-lg text-gray-900">الإجمالي</td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-lg text-green-700">
                      {formatCurrency(data.assets.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* عليه (Liabilities) */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            علينا
          </h2>
          <Card>
            <div className="space-y-6">
              {/* Outbound Debts Table */}
              {parseFloat(data.liabilities.outboundDebts.total) > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">الديون الصادرة</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold text-gray-700">ترتيب</th>
                          <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold text-gray-700">الوصف</th>
                          <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold text-gray-700">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-600">1</td>
                          <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-900">الديون الصادرة (علينا)</td>
                          <td className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(data.liabilities.outboundDebts.total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Unpaid Procurement Orders Table */}
              {data.liabilities.unpaidProcOrders.bySupplier && data.liabilities.unpaidProcOrders.bySupplier.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">أوامر الشراء غير المدفوعة</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold text-gray-700">ترتيب</th>
                          <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold text-gray-700">المورد</th>
                          <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold text-gray-700">المبلغ المتبقي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.liabilities.unpaidProcOrders.bySupplier.map((supplier: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-600">{idx + 1}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-900">{supplier.supplierName}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold text-gray-900">
                              {formatCurrency(supplier.totalOutstanding)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Total Liabilities */}
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="bg-red-50 font-bold">
                      <td className="border border-gray-300 px-4 py-3 text-right text-lg text-gray-900">الإجمالي</td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-lg text-red-700">
                        {formatCurrency(data.liabilities.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Net Summary */}
      <div className="mt-8">
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <tbody>
                <tr className="bg-blue-50 font-bold">
                  <td className="border border-gray-300 px-4 py-3 text-right text-xl text-gray-900">الصافي (له - علينا)</td>
                  <td className={`border border-gray-300 px-4 py-3 text-right text-xl font-bold ${parseFloat(data.net) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(data.net)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

