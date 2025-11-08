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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">له و عليه</h1>
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/accounting')}
        >
          العودة للمحاسبة
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-sm font-semibold mb-1">إجمالي له</h3>
          <p className="text-3xl font-bold">{formatCurrency(data.assets.total)}</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <h3 className="text-sm font-semibold mb-1">إجمالي عليه</h3>
          <p className="text-3xl font-bold">{formatCurrency(data.liabilities.total)}</p>
        </Card>

        <Card className={`bg-gradient-to-br ${parseFloat(data.net) >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white`}>
          <h3 className="text-sm font-semibold mb-1">الصافي</h3>
          <p className="text-3xl font-bold">{formatCurrency(data.net)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* له (Assets) */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-green-500 pb-2">
            له (الأصول)
          </h2>

          {/* Stock Values */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              قيمة المخزون حسب المخازن (بسعر الجملة)
            </h3>
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">إجمالي قيمة المخزون:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.assets.stockValues.total)}
                </span>
              </div>
            </div>
            
            {data.assets.stockValues.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المخزن</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الصنف</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكمية</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">سعر الجملة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">القيمة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.assets.stockValues.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.inventoryName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.itemName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(item.wholesalePrice)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(item.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد مخزونات</p>
            )}
          </Card>

          {/* Liquid Cash */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              القيم السائلة لطرق الدفع
            </h3>
            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-green-800">النقدية (كاش)</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(data.assets.liquidCash.CASH)}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-blue-800">بنكك</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(data.assets.liquidCash.BANK)}
                  </span>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-purple-800">بنك النيل</span>
                  <span className="text-xl font-bold text-purple-600">
                    {formatCurrency(data.assets.liquidCash.BANK_NILE)}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">الإجمالي</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(data.assets.liquidCash.total)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Inbound Debts */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              الديون الواردة (لنا)
            </h3>
            <div className="mb-4 p-4 bg-teal-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">الإجمالي:</span>
                <span className="text-2xl font-bold text-teal-600">
                  {formatCurrency(data.assets.inboundDebts.total)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {data.assets.inboundDebts.count} دين
              </p>
            </div>
            
            {data.assets.inboundDebts.items.length > 0 ? (
              <div className="space-y-2">
                {data.assets.inboundDebts.items.map((debt: any) => (
                  <div key={debt.id} className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{debt.description}</p>
                        <p className="text-sm text-gray-600">{formatDateTime(debt.createdAt)}</p>
                      </div>
                      <span className="text-lg font-bold text-teal-600">
                        {formatCurrency(debt.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد ديون واردة</p>
            )}
          </Card>

          {/* Delivered Unpaid Sales */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              إجمالي المبيعات المسلمة غير المدفوعة
            </h3>
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">الإجمالي:</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(data.assets.deliveredUnpaidSales.total)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {data.assets.deliveredUnpaidSales.count} فاتورة
              </p>
            </div>
            
            {data.assets.deliveredUnpaidSales.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الفاتورة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المخزن</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدفوع</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المتبقي</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.assets.deliveredUnpaidSales.items.map((invoice: any) => (
                      <tr key={invoice.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{invoice.customerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{invoice.inventoryName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(invoice.total)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(invoice.paidAmount)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-yellow-600">{formatCurrency(invoice.outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد فواتير مسلمة غير مدفوعة</p>
            )}
          </Card>
        </div>

        {/* عليه (Liabilities) */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-red-500 pb-2">
            عليه (الالتزامات)
          </h2>

          {/* Outbound Debts */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              الديون الصادرة (علينا)
            </h3>
            <div className="mb-4 p-4 bg-red-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">الإجمالي:</span>
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.liabilities.outboundDebts.total)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {data.liabilities.outboundDebts.count} دين
              </p>
            </div>
            
            {data.liabilities.outboundDebts.items.length > 0 ? (
              <div className="space-y-2">
                {data.liabilities.outboundDebts.items.map((debt: any) => (
                  <div key={debt.id} className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{debt.description}</p>
                        <p className="text-sm text-gray-600">{formatDateTime(debt.createdAt)}</p>
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(debt.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد ديون صادرة</p>
            )}
          </Card>

          {/* Unpaid Procurement Orders */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              أوامر الشراء غير المدفوعة
            </h3>
            <div className="mb-4 p-4 bg-orange-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">الإجمالي:</span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(data.liabilities.unpaidProcOrders.total)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {data.liabilities.unpaidProcOrders.count} أمر شراء
              </p>
            </div>
            
            {data.liabilities.unpaidProcOrders.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الأمر</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المورد</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المخزن</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدفوع</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المتبقي</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.liabilities.unpaidProcOrders.items.map((order: any) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{order.supplierName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{order.inventoryName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(order.paidAmount)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-orange-600">{formatCurrency(order.outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد أوامر شراء غير مدفوعة</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

