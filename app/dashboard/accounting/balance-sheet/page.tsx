'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { formatCurrency } from '@/lib/utils';

export default function BalanceSheetPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await api.getBalanceSummary();
      setBalance(data);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = () => {
    if (!balance) return 0;
    const totalRevenue = parseFloat(balance.sales.received);
    const totalCosts = parseFloat(balance.procurement.total) + parseFloat(balance.expenses.total);
    return totalRevenue - totalCosts;
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(withdrawAmount);
    const profit = calculateProfit();

    if (amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (amount > profit) {
      alert(`لا يمكن سحب مبلغ أكبر من الربح المتاح: ${formatCurrency(profit)}`);
      return;
    }

    setSubmitting(true);
    try {
      // Record withdrawal as an expense
      await api.createExpense({
        amount: amount,
        method: 'CASH',
        description: `سحب أرباح${withdrawNotes ? ' - ' + withdrawNotes : ''}`,
      });

      alert('✅ تم سحب الأرباح بنجاح!');
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      setWithdrawNotes('');
      loadBalance();
    } catch (error: any) {
      alert(error.message || 'فشل سحب الأرباح');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  const profit = calculateProfit();
  const profitMargin = balance.sales.total > 0 
    ? (profit / parseFloat(balance.sales.total)) * 100 
    : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">الميزانية وقائمة الدخل</h1>
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/accounting')}
        >
          العودة للمحاسبة
        </Button>
      </div>

      {/* Income Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
            قائمة الدخل (Income Statement)
          </h2>

          {/* Revenue Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-green-700 mb-3">الإيرادات</h3>
            <div className="space-y-2 bg-green-50 p-4 rounded">
              <div className="flex justify-between">
                <span className="text-gray-700">إجمالي المبيعات:</span>
                <span className="font-semibold">{formatCurrency(balance.sales.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">عدد الفواتير:</span>
                <span className="text-sm">{balance.sales.count} فاتورة</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-700">المحصل فعلياً:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(balance.sales.received)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">المتبقي (ذمم):</span>
                <span className="text-orange-600">{formatCurrency(balance.sales.debt)}</span>
              </div>
            </div>
          </div>

          {/* Costs Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-700 mb-3">التكاليف</h3>
            <div className="space-y-2 bg-red-50 p-4 rounded">
              <div className="flex justify-between">
                <span className="text-gray-700">تكلفة المشتريات:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(balance.procurement.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">عدد أوامر الشراء:</span>
                <span className="text-sm">{balance.procurement.count} أمر</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-700">المنصرفات:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(balance.expenses.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">عدد المنصرفات:</span>
                <span className="text-sm">{balance.expenses.count} منصرف</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2 font-bold">
                <span className="text-gray-800">إجمالي التكاليف:</span>
                <span className="text-red-700">
                  {formatCurrency(
                    parseFloat(balance.procurement.total) + parseFloat(balance.expenses.total)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Profit/Loss Section */}
          <div className="border-t-2 pt-4">
            <div className={`p-4 rounded-lg ${
              profit >= 0 
                ? 'bg-gradient-to-br from-green-100 to-green-200' 
                : 'bg-gradient-to-br from-red-100 to-red-200'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xl font-bold text-gray-800">
                  {profit >= 0 ? '💰 صافي الربح' : '📉 صافي الخسارة'}
                </span>
                <span className={`text-3xl font-bold ${
                  profit >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCurrency(Math.abs(profit))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">هامش الربح:</span>
                <span className={`font-semibold ${
                  profitMargin >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {profitMargin.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Balance Sheet */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-3">
            الميزانية (Balance Sheet)
          </h2>

          <div className="space-y-6">
            {/* Assets */}
            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-3">الأصول</h3>
              <div className="space-y-2 bg-blue-50 p-4 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-700">الرصيد الصافي (نقد):</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(balance.balance.net)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">ذمم مدينة (عملاء):</span>
                  <span className="font-semibold">
                    {formatCurrency(balance.sales.debt)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2 font-bold">
                  <span className="text-gray-800">إجمالي الأصول:</span>
                  <span className="text-blue-700">
                    {formatCurrency(
                      parseFloat(balance.balance.net) + parseFloat(balance.sales.debt)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Capital */}
            <div>
              <h3 className="text-lg font-semibold text-purple-700 mb-3">حقوق الملكية</h3>
              <div className="space-y-2 bg-purple-50 p-4 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-700">رأس المال الافتتاحي:</span>
                  <span className="font-semibold">
                    {formatCurrency(balance.balance.opening)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    {profit >= 0 ? 'الأرباح المحتجزة:' : 'الخسائر المتراكمة:'}
                  </span>
                  <span className={`font-semibold ${
                    profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(profit))}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2 font-bold">
                  <span className="text-gray-800">إجمالي حقوق الملكية:</span>
                  <span className="text-purple-700">
                    {formatCurrency(parseFloat(balance.balance.opening) + profit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profit Withdrawal */}
            {profit > 0 && (
              <div className="border-t-2 pt-4">
                {!showWithdrawForm ? (
                  <Button
                    onClick={() => setShowWithdrawForm(true)}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    💰 سحب أرباح
                  </Button>
                ) : (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">سحب أرباح</h4>
                    <form onSubmit={handleWithdraw}>
                      <Input
                        label="المبلغ المراد سحبه"
                        type="number"
                        step="0.01"
                        min="0"
                        max={profit}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder={`الحد الأقصى: ${formatCurrency(profit)}`}
                        required
                      />
                      <Input
                        label="ملاحظات (اختياري)"
                        value={withdrawNotes}
                        onChange={(e) => setWithdrawNotes(e.target.value)}
                        placeholder="سبب السحب أو ملاحظات"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting ? 'جاري السحب...' : 'تأكيد السحب'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setShowWithdrawForm(false);
                            setWithdrawAmount('');
                            setWithdrawNotes('');
                          }}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {profit <= 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ لا يمكن سحب أرباح حالياً. يجب أن يكون هناك ربح صافي موجب.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-sm font-semibold mb-1">الإيرادات المحصلة</h3>
          <p className="text-2xl font-bold">{formatCurrency(balance.sales.received)}</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <h3 className="text-sm font-semibold mb-1">إجمالي التكاليف</h3>
          <p className="text-2xl font-bold">
            {formatCurrency(
              parseFloat(balance.procurement.total) + parseFloat(balance.expenses.total)
            )}
          </p>
        </Card>

        <Card className={`bg-gradient-to-br ${
          profit >= 0 
            ? 'from-purple-500 to-purple-600' 
            : 'from-orange-500 to-orange-600'
        } text-white`}>
          <h3 className="text-sm font-semibold mb-1">
            {profit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}
          </h3>
          <p className="text-2xl font-bold">{formatCurrency(Math.abs(profit))}</p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-sm font-semibold mb-1">الرصيد النقدي</h3>
          <p className="text-2xl font-bold">{formatCurrency(balance.balance.net)}</p>
        </Card>
      </div>
    </div>
  );
}

