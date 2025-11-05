'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { formatCurrency } from '@/lib/utils';

export default function CloseBalancePage() {
  const router = useRouter();
  const [balance, setBalance] = useState<any>(null);
  const [balanceStatus, setBalanceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [openFormData, setOpenFormData] = useState({
    amount: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceData, statusData] = await Promise.all([
        api.getBalanceSummary(),
        api.getBalanceStatus(),
      ]);
      setBalance(balanceData);
      setBalanceStatus(statusData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBalance = async () => {
    if (!confirm('هل أنت متأكد من إقفال الحساب؟ هذا سيوقف جميع المعاملات الجديدة.')) {
      return;
    }

    setClosing(true);
    try {
      await api.closeBalance();
      alert('تم إقفال الحساب بنجاح');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'فشل إقفال الحساب');
    } finally {
      setClosing(false);
    }
  };

  const handleOpenBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpening(true);
    try {
      await api.openBalance({
        amount: parseFloat(openFormData.amount),
        notes: openFormData.notes,
      });
      alert('تم فتح حساب جديد بنجاح');
      setShowOpenForm(false);
      setOpenFormData({ amount: '', notes: '' });
      await loadData();
    } catch (error: any) {
      alert(error.message || 'فشل فتح الحساب');
    } finally {
      setOpening(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  const profit = (parseFloat(balance.sales.received) + parseFloat(balance.income?.total || 0)) - 
    (parseFloat(balance.procurement.total) + parseFloat(balance.expenses.total));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">إقفال الحساب</h1>
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/accounting')}
        >
          العودة للمحاسبة
        </Button>
      </div>

      {/* Balance Status */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">حالة الحساب</h2>
        {balanceStatus.isOpen ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-green-800 font-semibold">الحساب مفتوح</span>
            </div>
            {balanceStatus.lastBalance && (
              <p className="text-sm text-green-700 mt-2">
                آخر رصيد افتتاحي: {formatCurrency(balanceStatus.lastBalance.amount)} - 
                {new Date(balanceStatus.lastBalance.openedAt).toLocaleDateString('ar-SD')}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
              <span className="text-red-800 font-semibold">الحساب مغلق</span>
            </div>
            <p className="text-sm text-red-700 mt-2">
              لا يمكن إجراء معاملات جديدة حتى يتم فتح حساب جديد
            </p>
          </div>
        )}
      </Card>

      {/* Current Balance Summary */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">ملخص الحساب الحالي</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-green-800 mb-1">الإيرادات المحصلة</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(balance.sales.received)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-red-800 mb-1">إجمالي التكاليف</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(parseFloat(balance.procurement.total) + parseFloat(balance.expenses.total))}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${profit >= 0 ? 'bg-purple-50' : 'bg-orange-50'}`}>
            <h3 className={`text-sm font-semibold mb-1 ${profit >= 0 ? 'text-purple-800' : 'text-orange-800'}`}>
              {profit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}
            </h3>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>
              {formatCurrency(Math.abs(profit))}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">الرصيد النقدي</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(balance.balance.net)}
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      {balanceStatus.isOpen ? (
        <Card>
          <h2 className="text-xl font-semibold mb-4">إقفال الحساب</h2>
          <p className="text-gray-600 mb-4">
            إقفال الحساب سيوقف جميع المعاملات الجديدة (المبيعات، المشتريات، المنصرفات) 
            حتى يتم فتح حساب جديد.
          </p>
          <Button
            onClick={handleCloseBalance}
            disabled={closing}
            className="bg-red-600 hover:bg-red-700"
          >
            {closing ? 'جاري الإقفال...' : 'إقفال الحساب'}
          </Button>
        </Card>
      ) : (
        <Card>
          <h2 className="text-xl font-semibold mb-4">فتح حساب جديد</h2>
          <p className="text-gray-600 mb-4">
            لبدء معاملات جديدة، يجب فتح حساب جديد برصيد افتتاحي.
          </p>
          
          {!showOpenForm ? (
            <Button
              onClick={() => setShowOpenForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              فتح حساب جديد
            </Button>
          ) : (
            <form onSubmit={handleOpenBalance} className="space-y-4">
              <Input
                label="الرصيد الافتتاحي"
                type="number"
                step="0.01"
                min="0"
                value={openFormData.amount}
                onChange={(e) => setOpenFormData({ ...openFormData, amount: e.target.value })}
                placeholder="أدخل الرصيد الافتتاحي"
                required
              />
              <Input
                label="ملاحظات (اختياري)"
                value={openFormData.notes}
                onChange={(e) => setOpenFormData({ ...openFormData, notes: e.target.value })}
                placeholder="ملاحظات حول الرصيد الافتتاحي"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={opening}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {opening ? 'جاري الفتح...' : 'فتح الحساب'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowOpenForm(false);
                    setOpenFormData({ amount: '', notes: '' });
                  }}
                  disabled={opening}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}