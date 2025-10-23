'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { formatCurrency } from '@/lib/utils';
import { generateLiquidCashPDF } from '@/lib/pdfUtils';

export default function LiquidCashPage() {
  const router = useRouter();
  const [liquidData, setLiquidData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
              <div className="flex justify-between items-center">
                <span className="text-gray-700">إجمالي الإيرادات:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(liquidData.payments.cash.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>عدد الدفعات:</span>
                <span>{liquidData.payments.cash.count} دفعة</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">بنكك</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">إجمالي الإيرادات:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(liquidData.payments.bank.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>عدد الدفعات:</span>
                <span>{liquidData.payments.bank.count} دفعة</span>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">بنك النيل</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">إجمالي الإيرادات:</span>
                <span className="text-xl font-bold text-purple-600">
                  {formatCurrency(liquidData.payments.bankNile.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>عدد الدفعات:</span>
                <span>{liquidData.payments.bankNile.count} دفعة</span>
              </div>
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
              <div className="flex justify-between items-center">
                <span className="text-gray-700">إجمالي المنصرفات:</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(liquidData.expenses.cash.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>عدد المنصرفات:</span>
                <span>{liquidData.expenses.cash.count} منصرف</span>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">بنكك</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">إجمالي المنصرفات:</span>
                <span className="text-xl font-bold text-orange-600">
                  {formatCurrency(liquidData.expenses.bank.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>عدد المنصرفات:</span>
                <span>{liquidData.expenses.bank.count} منصرف</span>
              </div>
            </div>

            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-pink-800 mb-2">بنك النيل</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">إجمالي المنصرفات:</span>
                <span className="text-xl font-bold text-pink-600">
                  {formatCurrency(liquidData.expenses.bankNile.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>عدد المنصرفات:</span>
                <span>{liquidData.expenses.bankNile.count} منصرف</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

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
