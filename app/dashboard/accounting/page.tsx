'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import { formatCurrency } from '@/lib/utils';
import { useIsAuditor } from '@/lib/auditorUtils';

export default function AccountingPage() {
  const [balance, setBalance] = useState<any>(null);
  const [balanceStatus, setBalanceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isAuditor = useIsAuditor();

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

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">المحاسبة</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-semibold mb-2">إجمالي المبيعات</h3>
          <p className="text-3xl font-bold">{formatCurrency(balance.sales.total)}</p>
          <p className="text-sm mt-2">{balance.sales.count} فاتورة</p>
          <p className="text-sm">مدفوع: {formatCurrency(balance.sales.received)}</p>
          <p className="text-sm">متبقي: {formatCurrency(balance.sales.debt)}</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <h3 className="text-lg font-semibold mb-2">إجمالي المشتريات</h3>
          <p className="text-3xl font-bold">{formatCurrency(balance.procurement.total)}</p>
          <p className="text-sm mt-2">{balance.procurement.count} أمر شراء</p>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <h3 className="text-lg font-semibold mb-2">المنصرفات</h3>
          <p className="text-3xl font-bold">{formatCurrency(balance.expenses.total)}</p>
          <p className="text-sm mt-2">{balance.expenses.count} منصرف</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">الرصيد الصافي</h3>
          <p className="text-3xl font-bold">{formatCurrency(balance.balance.net)}</p>
          <p className="text-sm mt-2">رصيد الافتتاح: {formatCurrency(balance.balance.opening)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card title="التقارير المالية">
          <div className="space-y-2">
            <a
              href="/dashboard/accounting/balance-sheet"
              className="block px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded text-center font-semibold"
            >
              📊 الميزانية وقائمة الدخل
            </a>
            <a
              href="/dashboard/accounting/liquid-cash"
              className="block px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded text-center font-semibold"
            >
              💰 التقرير النقدي السائل
            </a>
            <a
              href="/dashboard/accounting/close-balance"
              className="block px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded text-center font-semibold"
            >
              📥 إقفال الحساب وتحميل التقرير
            </a>
            <a
              href="/dashboard/accounting/balance-sessions"
              className="block px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded text-center font-semibold"
            >
              📊 جلسات الميزانية السابقة
            </a>
            <a
              href="/dashboard/accounting/expenses"
              className="block px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded"
            >
              المنصرفات
            </a>
          </div>
        </Card>

        <Card title="روابط سريعة">
          <div className="space-y-2">
            <a
              href="/dashboard/sales"
              className="block px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded"
            >
              فواتير المبيعات
            </a>
            <a
              href="/dashboard/procurement"
              className="block px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded"
            >
              أوامر الشراء
            </a>
            <a
              href="/dashboard/items"
              className="block px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded"
            >
              إدارة الأسعار
            </a>
          </div>
        </Card>

        {!isAuditor && (
          <Card title="الإجراءات">
            <div className="space-y-2">
              {balanceStatus?.isOpen ? (
                <a
                  href="/dashboard/accounting/expenses/new"
                  className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-center"
                >
                  إضافة منصرف
                </a>
              ) : (
                <a
                  href="/dashboard/accounting/close-balance"
                  className="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-center"
                >
                  فتح حساب جديد
                </a>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

