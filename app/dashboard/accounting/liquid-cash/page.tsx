'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { formatCurrency, formatDateTime, paymentMethodLabels } from '@/lib/utils';
import { generateLiquidCashPDF } from '@/lib/pdfUtils';

export default function LiquidCashPage() {
  const router = useRouter();
  const [liquidData, setLiquidData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingDebt, setPayingDebt] = useState<string | null>(null);

  useEffect(() => {
    loadLiquidCash();
  }, []);

  const loadLiquidCash = async () => {
    try {
      const data = await api.getLiquidCash();
      setLiquidData(data);
    } catch (error) {
      console.error('Error loading liquid cash:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInboundDebt = async (debtId: string, method: string) => {
    if (!confirm(`هل تريد تسجيل استلام هذا الدين عبر ${paymentMethodLabels[method]}؟`)) {
      return;
    }

    setPayingDebt(debtId);
    try {
      await api.payInboundDebt(debtId, { method });
      alert('✅ تم تسجيل استلام الدين بنجاح!');
      await loadLiquidCash();
    } catch (error: any) {
      alert(error.message || 'فشل تسجيل استلام الدين');
    } finally {
      setPayingDebt(null);
    }
  };

  const handlePayOutboundDebt = async (debtId: string, method: string) => {
    if (!confirm(`هل تريد سداد هذا الدين عبر ${paymentMethodLabels[method]}؟`)) {
      return;
    }

    setPayingDebt(debtId);
    try {
      await api.payOutboundDebt(debtId, { method });
      alert('✅ تم سداد الدين بنجاح!');
      await loadLiquidCash();
    } catch (error: any) {
      alert(error.message || 'فشل سداد الدين');
    } finally {
      setPayingDebt(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">التقرير النقدي السائل</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => generateLiquidCashPDF(liquidData)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            📄 تصدير PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/accounting')}
          >
            العودة للمحاسبة
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-sm font-semibold mb-1">النقدية (كاش)</h3>
          <p className="text-2xl font-bold">{formatCurrency(liquidData.net.cash)}</p>
          <p className="text-sm opacity-90">
            {liquidData.payments.cash.count} دفعة
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-sm font-semibold mb-1">بنكك</h3>
          <p className="text-2xl font-bold">{formatCurrency(liquidData.net.bank)}</p>
          <p className="text-sm opacity-90">
            {liquidData.payments.bank.count} دفعة
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-sm font-semibold mb-1">بنك النيل</h3>
          <p className="text-2xl font-bold">{formatCurrency(liquidData.net.bankNile)}</p>
          <p className="text-sm opacity-90">
            {liquidData.payments.bankNile.count} دفعة
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <h3 className="text-sm font-semibold mb-1">إجمالي السيولة</h3>
          <p className="text-2xl font-bold">{formatCurrency(liquidData.net.total)}</p>
          <p className="text-sm opacity-90">
            {liquidData.payments.cash.count + liquidData.payments.bank.count + liquidData.payments.bankNile.count} دفعة إجمالية
          </p>
        </Card>
      </div>

      {/* Debt Balances */}
      {liquidData.debts && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <h3 className="text-sm font-semibold mb-1">الديون الواردة (لنا)</h3>
            <p className="text-2xl font-bold">{formatCurrency(liquidData.debts.inbound.total)}</p>
            <p className="text-sm opacity-90">
              {liquidData.debts.inbound.count} دين
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <h3 className="text-sm font-semibold mb-1">الديون الصادرة (علينا)</h3>
            <p className="text-2xl font-bold">{formatCurrency(liquidData.debts.outbound.total)}</p>
            <p className="text-sm opacity-90">
              {liquidData.debts.outbound.count} دين
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <h3 className="text-sm font-semibold mb-1">صافي الديون</h3>
            <p className="text-2xl font-bold">{formatCurrency(liquidData.debts.net)}</p>
            <p className="text-sm opacity-90">
              الفرق بين الديون الواردة والصادرة
            </p>
          </Card>
        </div>
      )}

      {/* Debt Details */}
      {liquidData.debts && (liquidData.debts.inbound.count > 0 || liquidData.debts.outbound.count > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Inbound Debts */}
          {liquidData.debts.inbound.count > 0 && (
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
                الديون الواردة (لنا) - {liquidData.debts.inbound.count}
              </h2>
              
              <div className="space-y-3">
                {liquidData.debts.inbound.items.map((debt: any) => (
                  <div key={debt.id} className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{debt.description}</p>
                        <p className="text-sm text-gray-600">{formatDateTime(debt.createdAt)}</p>
                      </div>
                      <span className="text-lg font-bold text-teal-600">
                        {formatCurrency(debt.amount)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handlePayInboundDebt(debt.id, 'CASH')}
                        disabled={payingDebt === debt.id}
                        className="bg-green-600 hover:bg-green-700 text-xs"
                      >
                        {payingDebt === debt.id ? 'جاري...' : '💵 كاش'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePayInboundDebt(debt.id, 'BANK')}
                        disabled={payingDebt === debt.id}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        {payingDebt === debt.id ? 'جاري...' : '🏦 بنكك'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePayInboundDebt(debt.id, 'BANK_NILE')}
                        disabled={payingDebt === debt.id}
                        className="bg-purple-600 hover:bg-purple-700 text-xs"
                      >
                        {payingDebt === debt.id ? 'جاري...' : '🏦 بنك النيل'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Outbound Debts */}
          {liquidData.debts.outbound.count > 0 && (
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
                الديون الصادرة (علينا) - {liquidData.debts.outbound.count}
              </h2>
              
              <div className="space-y-3">
                {liquidData.debts.outbound.items.map((debt: any) => (
                  <div key={debt.id} className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{debt.description}</p>
                        <p className="text-sm text-gray-600">{formatDateTime(debt.createdAt)}</p>
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(debt.amount)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="small"
                        onClick={() => handlePayOutboundDebt(debt.id, 'CASH')}
                        disabled={payingDebt === debt.id}
                        className="bg-green-600 hover:bg-green-700 text-xs"
                      >
                        {payingDebt === debt.id ? 'جاري...' : '💵 دفع كاش'}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handlePayOutboundDebt(debt.id, 'BANK')}
                        disabled={payingDebt === debt.id}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        {payingDebt === debt.id ? 'جاري...' : '🏦 دفع بنكك'}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handlePayOutboundDebt(debt.id, 'BANK_NILE')}
                        disabled={payingDebt === debt.id}
                        className="bg-purple-600 hover:bg-purple-700 text-xs"
                      >
                        {payingDebt === debt.id ? 'جاري...' : '🏦 دفع بنك النيل'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
            الإيرادات حسب طريقة الدفع
          </h2>

          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">النقدية (كاش)</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">إجمالي الإيرادات:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(liquidData.payments.cash.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                <span>عدد الدفعات:</span>
                <span>{liquidData.payments.cash.count} دفعة</span>
              </div>
              {/* Items Details */}
              {liquidData.payments.cash.items && liquidData.payments.cash.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">الأصناف المباعة:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-right">
                          <th className="px-2 py-1 text-xs font-medium text-green-700">الصنف</th>
                          <th className="px-2 py-1 text-xs font-medium text-green-700">الكمية</th>
                          <th className="px-2 py-1 text-xs font-medium text-green-700">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liquidData.payments.cash.items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-t border-green-100">
                            <td className="px-2 py-1 text-green-900">{item.name}</td>
                            <td className="px-2 py-1 text-green-700">{item.quantity}</td>
                            <td className="px-2 py-1 text-green-700 font-medium">{formatCurrency(item.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">بنكك</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">إجمالي الإيرادات:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(liquidData.payments.bank.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                <span>عدد الدفعات:</span>
                <span>{liquidData.payments.bank.count} دفعة</span>
              </div>
              {/* Items Details */}
              {liquidData.payments.bank.items && liquidData.payments.bank.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">الأصناف المباعة:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-right">
                          <th className="px-2 py-1 text-xs font-medium text-blue-700">الصنف</th>
                          <th className="px-2 py-1 text-xs font-medium text-blue-700">الكمية</th>
                          <th className="px-2 py-1 text-xs font-medium text-blue-700">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liquidData.payments.bank.items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-t border-blue-100">
                            <td className="px-2 py-1 text-blue-900">{item.name}</td>
                            <td className="px-2 py-1 text-blue-700">{item.quantity}</td>
                            <td className="px-2 py-1 text-blue-700 font-medium">{formatCurrency(item.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">بنك النيل</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">إجمالي الإيرادات:</span>
                <span className="text-xl font-bold text-purple-600">
                  {formatCurrency(liquidData.payments.bankNile.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                <span>عدد الدفعات:</span>
                <span>{liquidData.payments.bankNile.count} دفعة</span>
              </div>
              {/* Items Details */}
              {liquidData.payments.bankNile.items && liquidData.payments.bankNile.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <h4 className="text-sm font-semibold text-purple-800 mb-2">الأصناف المباعة:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-right">
                          <th className="px-2 py-1 text-xs font-medium text-purple-700">الصنف</th>
                          <th className="px-2 py-1 text-xs font-medium text-purple-700">الكمية</th>
                          <th className="px-2 py-1 text-xs font-medium text-purple-700">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liquidData.payments.bankNile.items.map((item: any, idx: number) => (
                          <tr key={idx} className="border-t border-purple-100">
                            <td className="px-2 py-1 text-purple-900">{item.name}</td>
                            <td className="px-2 py-1 text-purple-700">{item.quantity}</td>
                            <td className="px-2 py-1 text-purple-700 font-medium">{formatCurrency(item.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">إجمالي الإيرادات:</span>
                <span className="text-2xl font-bold text-gray-800">
                  {formatCurrency(liquidData.payments.total)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Expenses */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
            المنصرفات حسب طريقة الدفع
          </h2>

          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">النقدية (كاش)</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">إجمالي المنصرفات:</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(liquidData.expenses.cash.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                <span>عدد المنصرفات:</span>
                <span>{liquidData.expenses.cash.count} منصرف</span>
              </div>
              {/* Expense Items */}
              {liquidData.expenses.cash.items && liquidData.expenses.cash.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">تفاصيل المنصرفات:</h4>
                  <div className="space-y-1">
                    {liquidData.expenses.cash.items.slice(0, 5).map((expense: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-red-800">{expense.description}</span>
                        <span className="text-red-600 font-medium">{formatCurrency(expense.amount)}</span>
                      </div>
                    ))}
                    {liquidData.expenses.cash.items.length > 5 && (
                      <div className="text-xs text-red-600 mt-1">
                        و {liquidData.expenses.cash.items.length - 5} منصرف آخر...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">بنكك</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">إجمالي المنصرفات:</span>
                <span className="text-xl font-bold text-orange-600">
                  {formatCurrency(liquidData.expenses.bank.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                <span>عدد المنصرفات:</span>
                <span>{liquidData.expenses.bank.count} منصرف</span>
              </div>
              {/* Expense Items */}
              {liquidData.expenses.bank.items && liquidData.expenses.bank.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2">تفاصيل المنصرفات:</h4>
                  <div className="space-y-1">
                    {liquidData.expenses.bank.items.slice(0, 5).map((expense: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-orange-800">{expense.description}</span>
                        <span className="text-orange-600 font-medium">{formatCurrency(expense.amount)}</span>
                      </div>
                    ))}
                    {liquidData.expenses.bank.items.length > 5 && (
                      <div className="text-xs text-orange-600 mt-1">
                        و {liquidData.expenses.bank.items.length - 5} منصرف آخر...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-pink-800 mb-2">بنك النيل</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">إجمالي المنصرفات:</span>
                <span className="text-xl font-bold text-pink-600">
                  {formatCurrency(liquidData.expenses.bankNile.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                <span>عدد المنصرفات:</span>
                <span>{liquidData.expenses.bankNile.count} منصرف</span>
              </div>
              {/* Expense Items */}
              {liquidData.expenses.bankNile.items && liquidData.expenses.bankNile.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-pink-200">
                  <h4 className="text-sm font-semibold text-pink-800 mb-2">تفاصيل المنصرفات:</h4>
                  <div className="space-y-1">
                    {liquidData.expenses.bankNile.items.slice(0, 5).map((expense: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-pink-800">{expense.description}</span>
                        <span className="text-pink-600 font-medium">{formatCurrency(expense.amount)}</span>
                      </div>
                    ))}
                    {liquidData.expenses.bankNile.items.length > 5 && (
                      <div className="text-xs text-pink-600 mt-1">
                        و {liquidData.expenses.bankNile.items.length - 5} منصرف آخر...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        
          {/* Summary: salaries and advances included in costs */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg border">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">ملخص التكاليف الأخرى</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">المرتبات</span>
                <span className="font-semibold">{formatCurrency(parseFloat(liquidData?.salaries?.total || '0'))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">السلفيات</span>
                <span className="font-semibold">{formatCurrency(parseFloat(liquidData?.advances?.total || '0'))}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex items-center justify-between">
                <span className="text-gray-900 font-semibold">إجمالي المنصرفات (تشغيلي + مرتبات + سلفيات)</span>
                <span className="text-gray-900 font-bold">
                  {formatCurrency(
                    (parseFloat(liquidData?.expenses?.total || '0') || 0) +
                    (parseFloat(liquidData?.salaries?.total || '0') || 0) +
                    (parseFloat(liquidData?.advances?.total || '0') || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Procurement Items */}
      {liquidData.procurement && liquidData.procurement.items && liquidData.procurement.items.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
            الأصناف المشتراة (المشتريات)
          </h2>
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
                    تكلفة الوحدة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجمالي
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {liquidData.procurement.items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Net Summary */}
      <Card className="mt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
          صافي السيولة النقدية
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">النقدية (كاش)</h3>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(liquidData.net.cash)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              صافي النقدية المتاح
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">بنكك</h3>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(liquidData.net.bank)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              صافي رصيد بنكك
            </p>
          </div>

          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">بنك النيل</h3>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(liquidData.net.bankNile)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              صافي رصيد بنك النيل
            </p>
          </div>
        </div>

        <div className="mt-6 p-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">إجمالي السيولة النقدية</h3>
            <p className="text-4xl font-bold text-gray-900">
              {formatCurrency(liquidData.net.total)}
            </p>
            <p className="text-lg text-gray-600 mt-2">
              المبلغ الإجمالي المتاح في جميع الحسابات
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
