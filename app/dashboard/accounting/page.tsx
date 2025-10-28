'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useIsAuditor } from '@/lib/auditorUtils';
import { useUser } from '@/lib/userContext';

export default function AccountingPage() {
  const { user } = useUser();
  const [balance, setBalance] = useState<any>(null);
  const [balanceStatus, setBalanceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [submittingExchange, setSubmittingExchange] = useState(false);
  const [exchangeData, setExchangeData] = useState({
    amount: '',
    fromMethod: 'CASH',
    toMethod: 'BANK',
    receiptNumber: '',
    receiptUrl: '',
    notes: '',
  });
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [duplicateError, setDuplicateError] = useState<any>(null);
  const [cashExchanges, setCashExchanges] = useState<any[]>([]);
  const isAuditor = useIsAuditor();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceData, statusData, exchangesData] = await Promise.all([
        api.getBalanceSummary(),
        api.getBalanceStatus(),
        api.getCashExchanges().catch(() => []),
      ]);
      setBalance(balanceData);
      setBalanceStatus(statusData);
      setCashExchanges(exchangesData);
      
      // Log for debugging
      if (!statusData?.isOpen) {
        console.log('Balance is closed - cash exchange button will be disabled');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('فشل تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptImage(file);
      // Create a local URL for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setExchangeData({ ...exchangeData, receiptUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingExchange(true);
    setDuplicateError(null);
    
    try {
      await api.createCashExchange({
        amount: parseFloat(exchangeData.amount),
        fromMethod: exchangeData.fromMethod,
        toMethod: exchangeData.toMethod,
        receiptNumber: exchangeData.receiptNumber || undefined,
        receiptUrl: exchangeData.receiptUrl,
        notes: exchangeData.notes,
      });
      setShowExchangeForm(false);
      setExchangeData({
        amount: '',
        fromMethod: 'CASH',
        toMethod: 'BANK',
        receiptNumber: '',
        receiptUrl: '',
        notes: '',
      });
      setReceiptImage(null);
      await loadData();
      alert('تم تسجيل صرف النقد بنجاح');
    } catch (error: any) {
      // Check if error has existing transaction details
      if (error.existingTransaction) {
        setDuplicateError({ error: error.error || error.message, existingTransaction: error.existingTransaction });
        return;
      }
      alert(error.message || error.error || 'فشل تسجيل صرف النقد');
    } finally {
      setSubmittingExchange(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!balance) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">المحاسبة</h1>
        <div className="text-center py-8">
          <p className="text-red-600 text-lg">خطأ في تحميل البيانات</p>
          <p className="text-gray-600 mt-2">يرجى المحاولة مرة أخرى أو التواصل مع المدير</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">المحاسبة</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-semibold mb-2">إجمالي المبيعات</h3>
          <p className="text-3xl font-bold">{formatCurrency(balance.sales?.total || 0)}</p>
          <p className="text-sm mt-2">{balance.sales?.count || 0} فاتورة</p>
          <p className="text-sm">مدفوع: {formatCurrency(balance.sales?.received || 0)}</p>
          <p className="text-sm">متبقي: {formatCurrency(balance.sales?.debt || 0)}</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <h3 className="text-lg font-semibold mb-2">إجمالي المشتريات</h3>
          <p className="text-3xl font-bold">{formatCurrency(balance.procurement?.total || 0)}</p>
          <p className="text-sm mt-2">{balance.procurement?.count || 0} أمر شراء</p>
          {balance.procurement?.cancelled && balance.procurement.cancelled.count > 0 && (
            <p className="text-sm mt-1 opacity-90">
              ملغي: {balance.procurement.cancelled.count} ({formatCurrency(parseFloat(balance.procurement.cancelled.total))})
            </p>
          )}
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <h3 className="text-lg font-semibold mb-2">المنصرفات</h3>
          <p className="text-3xl font-bold">{formatCurrency(balance.expenses?.total || 0)}</p>
          <p className="text-sm mt-2">{balance.expenses?.count || 0} منصرف</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">الرصيد الصافي</h3>
          <p className="text-3xl font-bold">{formatCurrency(balance.balance?.net || 0)}</p>
          <p className="text-sm mt-2">رصيد الافتتاح: {formatCurrency(balance.balance?.opening || 0)}</p>
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
                <>
                  <a
                    href="/dashboard/accounting/expenses/new"
                    className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-center"
                  >
                    إضافة منصرف
                  </a>
                  {(user?.role === 'ACCOUNTANT' || user?.role === 'MANAGER') && balanceStatus?.isOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowExchangeForm(!showExchangeForm);
                        setDuplicateError(null);
                      }}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-center font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={!balanceStatus?.isOpen}
                    >
                      {showExchangeForm ? 'إلغاء صرف النقد/بنك' : 'صرف نقد/بنك'}
                    </button>
                  )}
                </>
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

      {/* Cash Exchange Form */}
      {!isAuditor && (user?.role === 'ACCOUNTANT' || user?.role === 'MANAGER') && showExchangeForm && balanceStatus?.isOpen && (
        <Card title="صرف نقد/بنك" className="mt-6">
          <form onSubmit={handleExchange}>
            {duplicateError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold mb-2">{duplicateError.error}</p>
                {duplicateError.existingTransaction && (
                  <div className="text-sm text-red-700">
                    <p className="font-semibold mb-1">تفاصيل المعاملة السابقة:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {duplicateError.existingTransaction.invoiceNumber && (
                        <li>رقم الفاتورة: {duplicateError.existingTransaction.invoiceNumber}</li>
                      )}
                      {duplicateError.existingTransaction.customer && (
                        <li>العميل: {duplicateError.existingTransaction.customer}</li>
                      )}
                      <li>المبلغ: {formatCurrency(parseFloat(duplicateError.existingTransaction.amount))}</li>
                      <li>رقم الإيصال: {duplicateError.existingTransaction.receiptNumber}</li>
                      {duplicateError.existingTransaction.fromMethod && (
                        <li>من: {
                          duplicateError.existingTransaction.fromMethod === 'CASH' ? 'كاش' :
                          duplicateError.existingTransaction.fromMethod === 'BANK' ? 'بنكك' : 'بنك النيل'
                        }</li>
                      )}
                      {duplicateError.existingTransaction.toMethod && (
                        <li>إلى: {
                          duplicateError.existingTransaction.toMethod === 'CASH' ? 'كاش' :
                          duplicateError.existingTransaction.toMethod === 'BANK' ? 'بنكك' : 'بنك النيل'
                        }</li>
                      )}
                      {duplicateError.existingTransaction.paidAt && (
                        <li>التاريخ: {formatDateTime(duplicateError.existingTransaction.paidAt)}</li>
                      )}
                      {duplicateError.existingTransaction.createdAt && (
                        <li>التاريخ: {formatDateTime(duplicateError.existingTransaction.createdAt)}</li>
                      )}
                      {duplicateError.existingTransaction.recordedBy && (
                        <li>بواسطة: {duplicateError.existingTransaction.recordedBy}</li>
                      )}
                      {duplicateError.existingTransaction.createdBy && (
                        <li>بواسطة: {duplicateError.existingTransaction.createdBy}</li>
                      )}
                    </ul>
                  </div>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDuplicateError(null)}
                  className="mt-2"
                >
                  إغلاق
                </Button>
              </div>
            )}

            <Input
              label="المبلغ"
              type="number"
              step="0.01"
              min="0.01"
              value={exchangeData.amount}
              onChange={(e) => setExchangeData({ ...exchangeData, amount: e.target.value })}
              required
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                من
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={exchangeData.fromMethod}
                onChange={(e) => {
                  const newFromMethod = e.target.value;
                  // If from and to are the same, swap to
                  if (newFromMethod === exchangeData.toMethod) {
                    const newToMethod = exchangeData.fromMethod;
                    setExchangeData({ ...exchangeData, fromMethod: newFromMethod, toMethod: newToMethod });
                  } else {
                    setExchangeData({ ...exchangeData, fromMethod: newFromMethod });
                  }
                }}
                required
              >
                <option value="CASH">كاش</option>
                <option value="BANK">بنكك</option>
                <option value="BANK_NILE">بنك النيل</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                إلى
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={exchangeData.toMethod}
                onChange={(e) => {
                  const newToMethod = e.target.value;
                  // If from and to are the same, swap from
                  if (newToMethod === exchangeData.fromMethod) {
                    const newFromMethod = exchangeData.toMethod;
                    setExchangeData({ ...exchangeData, fromMethod: newFromMethod, toMethod: newToMethod });
                  } else {
                    setExchangeData({ ...exchangeData, toMethod: newToMethod });
                  }
                }}
                required
              >
                <option value="CASH">كاش</option>
                <option value="BANK">بنكك</option>
                <option value="BANK_NILE">بنك النيل</option>
              </select>
            </div>

            <Input
              label={
                (exchangeData.fromMethod === 'CASH' && (exchangeData.toMethod === 'BANK' || exchangeData.toMethod === 'BANK_NILE')) ||
                ((exchangeData.fromMethod === 'BANK' || exchangeData.fromMethod === 'BANK_NILE') && exchangeData.toMethod === 'CASH')
                  ? 'رقم الإيصال (مطلوب)'
                  : 'رقم الإيصال (اختياري)'
              }
              value={exchangeData.receiptNumber}
              onChange={(e) => setExchangeData({ ...exchangeData, receiptNumber: e.target.value })}
              placeholder="أدخل رقم الإيصال"
              required={
                (exchangeData.fromMethod === 'CASH' && (exchangeData.toMethod === 'BANK' || exchangeData.toMethod === 'BANK_NILE')) ||
                ((exchangeData.fromMethod === 'BANK' || exchangeData.fromMethod === 'BANK_NILE') && exchangeData.toMethod === 'CASH')
              }
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                صورة الإيصال (اختياري)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {receiptImage && (
                <div className="mt-2">
                  <img 
                    src={exchangeData.receiptUrl} 
                    alt="Receipt preview" 
                    className="max-w-xs max-h-48 object-contain border rounded"
                  />
                </div>
              )}
            </div>

            <Input
              label="رابط الإيصال (اختياري إذا تم رفع صورة)"
              value={exchangeData.receiptUrl}
              onChange={(e) => setExchangeData({ ...exchangeData, receiptUrl: e.target.value })}
              placeholder="أدخل رابط الإيصال"
            />

            <Input
              label="ملاحظات (اختياري)"
              value={exchangeData.notes}
              onChange={(e) => setExchangeData({ ...exchangeData, notes: e.target.value })}
            />

            <div className="flex gap-2">
              <Button 
                type="submit"
                disabled={submittingExchange}
              >
                {submittingExchange ? 'جاري الحفظ...' : 'حفظ الصرف'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowExchangeForm(false);
                  setExchangeData({
                    amount: '',
                    fromMethod: 'CASH',
                    toMethod: 'BANK',
                    receiptNumber: '',
                    receiptUrl: '',
                    notes: '',
                  });
                  setReceiptImage(null);
                  setDuplicateError(null);
                }}
                disabled={submittingExchange}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Cash Exchanges List */}
      {cashExchanges.length > 0 && (
        <Card title="سجل صرف النقد" className="mt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">من → إلى</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الإيصال</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإيصال</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">بواسطة</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cashExchanges.map((exchange) => (
                  <tr key={exchange.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(exchange.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(parseFloat(exchange.amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exchange.fromMethod === 'CASH' ? 'كاش' : exchange.fromMethod === 'BANK' ? 'بنكك' : 'بنك النيل'}
                      {' → '}
                      {exchange.toMethod === 'CASH' ? 'كاش' : exchange.toMethod === 'BANK' ? 'بنكك' : 'بنك النيل'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exchange.receiptNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exchange.receiptUrl ? (
                        <a 
                          href={exchange.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          عرض الإيصال
                        </a>
                      ) : (
                        'غير متوفر'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exchange.createdByUser?.username || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

