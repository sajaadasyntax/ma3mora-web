'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { formatCurrency, formatDateTime, paymentMethodLabels } from '@/lib/utils';
import { generatePDF } from '@/lib/pdfUtils';

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

  const handlePrint = () => {
    if (!data) return;
    const currentDate = new Date().toLocaleDateString('ar-SD', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const assetsRowsHtml = assetsRows.map((row, idx) => `
      <tr>
        <td>${row.label}</td>
        <td>${formatCurrency(row.value)}</td>
      </tr>
    `).join('');

    const liabilitiesRowsHtml = [
      ...(parseFloat(data.liabilities.outboundDebts.total) > 0 ? [`
        <tr>
          <td>1</td>
          <td>الديون الصادرة (علينا)</td>
          <td>${formatCurrency(parseFloat(data.liabilities.outboundDebts.total))}</td>
        </tr>
      `] : []),
      ...(data.liabilities.unpaidProcOrders.bySupplier || []).map((supplier: any, idx: number) => `
        <tr>
          <td>${idx + 2}</td>
          <td>${supplier.supplierName}</td>
          <td>${formatCurrency(parseFloat(supplier.totalOutstanding))}</td>
        </tr>
      `),
    ].join('');

    const html = `
      <div class="header">
        <h1>له و عليه (الأصول والالتزامات)</h1>
        <div class="date">تاريخ التقرير: ${currentDate}</div>
      </div>

      <div class="section">
        <h2>له (الأصول)</h2>
        <table>
          <thead>
            <tr>
              <th>الوصف</th>
              <th>القيمة</th>
            </tr>
          </thead>
          <tbody>
            ${assetsRowsHtml}
            <tr style="background-color: #d1fae5; font-weight: bold;">
              <td>الإجمالي</td>
              <td style="color: #065f46;">${formatCurrency(parseFloat(data.assets.total))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>علينا (الالتزامات)</h2>
        ${parseFloat(data.liabilities.outboundDebts.total) > 0 ? `
        <h3>الديون الصادرة</h3>
        <table>
          <thead>
            <tr>
              <th>ترتيب</th>
              <th>الوصف</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>الديون الصادرة (علينا)</td>
              <td>${formatCurrency(parseFloat(data.liabilities.outboundDebts.total))}</td>
            </tr>
          </tbody>
        </table>
        ` : ''}
        
        ${data.liabilities.unpaidProcOrders.bySupplier && data.liabilities.unpaidProcOrders.bySupplier.length > 0 ? `
        <h3>أوامر الشراء غير المدفوعة</h3>
        <table>
          <thead>
            <tr>
              <th>ترتيب</th>
              <th>المورد</th>
              <th>المبلغ المتبقي</th>
            </tr>
          </thead>
          <tbody>
            ${data.liabilities.unpaidProcOrders.bySupplier.map((supplier: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${supplier.supplierName}</td>
                <td>${formatCurrency(parseFloat(supplier.totalOutstanding))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        
        <table>
          <tbody>
            <tr style="background-color: #fee2e2; font-weight: bold;">
              <td>الإجمالي</td>
              <td style="color: #991b1b;">${formatCurrency(parseFloat(data.liabilities.total))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>الصافي</h2>
        <table>
          <tbody>
            <tr style="background-color: #dbeafe; font-weight: bold; font-size: 18px;">
              <td>الصافي (له - علينا)</td>
              <td style="color: ${parseFloat(data.net) >= 0 ? '#065f46' : '#991b1b'};">
                ${formatCurrency(parseFloat(data.net))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    generatePDF(html, 'له_و_عليه');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">له و عليه</h1>
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700"
          >
            🖨️ طباعة
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/accounting')}
          >
            العودة للمحاسبة
          </Button>
        </div>
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

