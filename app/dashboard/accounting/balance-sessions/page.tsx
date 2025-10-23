'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { generateBalanceSheetPDF } from '@/lib/pdfUtils';

export default function BalanceSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.getBalanceSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSessionPDF = (session: any) => {
    // Create balance data structure for PDF generation
    const balanceData = {
      sales: session.summary.sales,
      procurement: session.summary.procurement,
      expenses: session.summary.expenses,
      balance: {
        opening: session.amount,
        net: session.summary.netBalance,
      }
    };

    generateBalanceSheetPDF(balanceData);
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">جلسات الميزانية</h1>
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/accounting')}
        >
          العودة للمحاسبة
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">لا توجد جلسات ميزانية سابقة</p>
            <p className="text-gray-400 text-sm mt-2">
              ستظهر جلسات الميزانية هنا بعد إقفال الحساب
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {sessions.map((session, index) => (
            <Card key={session.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    جلسة الميزانية #{sessions.length - index}
                  </h3>
                  <div className="text-sm text-gray-600 mt-1">
                    <p>تاريخ الفتح: {new Date(session.openedAt).toLocaleDateString('ar-SD')}</p>
                    <p>تاريخ الإقفال: {session.closedAt ? new Date(session.closedAt).toLocaleDateString('ar-SD') : 'غير محدد'}</p>
                    {session.notes && <p>ملاحظات: {session.notes}</p>}
                  </div>
                </div>
                <Button
                  onClick={() => generateSessionPDF(session)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  📄 تصدير PDF
                </Button>
              </div>

              {/* Session Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">الإيرادات المحصلة</h4>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(session.summary.sales.received)}
                  </p>
                  <p className="text-xs text-green-700">
                    {formatNumber(session.summary.sales.count)} فاتورة
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-800 mb-1">إجمالي التكاليف</h4>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(
                      parseFloat(session.summary.procurement.total) + 
                      parseFloat(session.summary.expenses.total)
                    )}
                  </p>
                  <p className="text-xs text-red-700">
                    {formatNumber(session.summary.procurement.count)} مشتريات + {formatNumber(session.summary.expenses.count)} منصرفات
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  parseFloat(session.summary.profit) >= 0 ? 'bg-purple-50' : 'bg-orange-50'
                }`}>
                  <h4 className={`text-sm font-semibold mb-1 ${
                    parseFloat(session.summary.profit) >= 0 ? 'text-purple-800' : 'text-orange-800'
                  }`}>
                    {parseFloat(session.summary.profit) >= 0 ? 'صافي الربح' : 'صافي الخسارة'}
                  </h4>
                  <p className={`text-xl font-bold ${
                    parseFloat(session.summary.profit) >= 0 ? 'text-purple-600' : 'text-orange-600'
                  }`}>
                    {formatCurrency(Math.abs(parseFloat(session.summary.profit)))}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">الرصيد النهائي</h4>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(session.summary.netBalance)}
                  </p>
                  <p className="text-xs text-blue-700">
                    رصيد افتتاحي: {formatCurrency(session.amount)}
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <h5 className="font-semibold text-gray-800 mb-2">المبيعات</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>إجمالي المبيعات:</span>
                      <span>{formatCurrency(session.summary.sales.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المحصل:</span>
                      <span className="text-green-600">{formatCurrency(session.summary.sales.received)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المتبقي:</span>
                      <span className="text-orange-600">{formatCurrency(session.summary.sales.debt)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <h5 className="font-semibold text-gray-800 mb-2">المشتريات</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>إجمالي المشتريات:</span>
                      <span className="text-red-600">{formatCurrency(session.summary.procurement.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عدد الأوامر:</span>
                      <span>{formatNumber(session.summary.procurement.count)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <h5 className="font-semibold text-gray-800 mb-2">المنصرفات</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>إجمالي المنصرفات:</span>
                      <span className="text-orange-600">{formatCurrency(session.summary.expenses.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عدد المنصرفات:</span>
                      <span>{formatNumber(session.summary.expenses.count)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
