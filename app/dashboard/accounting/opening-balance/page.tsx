'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OpeningBalancePage() {
  const router = useRouter();
  const [existingBalances, setExistingBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    cash: '',
    bank: '',
    fawry: '',
    notes: '',
  });

  useEffect(() => {
    loadExistingBalances();
  }, []);

  const loadExistingBalances = async () => {
    try {
      const data = await api.getOpeningBalances({ scope: 'CASHBOX' });
      setExistingBalances(data);
    } catch (error) {
      console.error('Error loading balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Use the new optimized balance/open endpoint that accepts all payment methods at once
      await api.openBalance({
        cash: parseFloat(formData.cash) || 0,
        bank: parseFloat(formData.bank) || 0,
        bankNile: parseFloat(formData.fawry) || 0,
        notes: formData.notes || undefined,
      });

      alert('✅ تم حفظ رأس المال الافتتاحي بنجاح! يمكنك الآن الوصول للنظام.');
      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message || 'فشل حفظ رأس المال');
    }
  };

  const calculateTotal = () => {
    const cash = parseFloat(formData.cash) || 0;
    const bank = parseFloat(formData.bank) || 0;
    const fawry = parseFloat(formData.fawry) || 0;
    return cash + bank + fawry;
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  const hasExistingBalances = existingBalances.length > 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">فتح الحساب - رأس المال الافتتاحي</h1>

      {!hasExistingBalances && (
        <Card className="mb-6 bg-yellow-50 border-2 border-yellow-400">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                مطلوب: إدخال رأس المال الافتتاحي
              </h3>
              <p className="text-yellow-800">
                يجب إدخال رأس المال الافتتاحي (كاش، بنكك، بنك النيل) قبل البدء باستخدام النظام.
                هذا إجراء ضروري لتتبع الحسابات بشكل دقيق.
              </p>
            </div>
          </div>
        </Card>
      )}

      {hasExistingBalances && (
        <Card className="mb-6 bg-blue-50 border border-blue-200">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">الأرصدة الافتتاحية الموجودة</h3>
          <div className="space-y-2">
            {existingBalances.map((balance) => (
              <div key={balance.id} className="flex justify-between items-center p-3 bg-white rounded">
                <div>
                  <p className="font-medium">{balance.notes}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(balance.openedAt)}
                  </p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(balance.amount)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <Input
                label="💵 رصيد الكاش (نقدي)"
                type="number"
                step="0.01"
                min="0"
                value={formData.cash}
                onChange={(e) => setFormData({ ...formData, cash: e.target.value })}
                placeholder="أدخل الرصيد النقدي"
              />
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <Input
                label="🏦 رصيد بنكك"
                type="number"
                step="0.01"
                min="0"
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                placeholder="أدخل رصيد بنكك"
              />
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <Input
                label="🏦 رصيد بنك النيل"
                type="number"
                step="0.01"
                min="0"
                value={formData.fawry}
                onChange={(e) => setFormData({ ...formData, fawry: e.target.value })}
                placeholder="أدخل رصيد بنك النيل"
              />
            </div>

            <Input
              label="ملاحظات (اختياري)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات إضافية"
            />

            <div className="border-t-2 border-gray-300 pt-4 mt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">إجمالي رأس المال:</h3>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(calculateTotal())}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-gray-600">كاش</p>
                  <p className="font-semibold text-green-700">
                    {formatCurrency(parseFloat(formData.cash) || 0)}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-gray-600">بنكك</p>
                  <p className="font-semibold text-blue-700">
                    {formatCurrency(parseFloat(formData.bank) || 0)}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-gray-600">بنك النيل</p>
                  <p className="font-semibold text-purple-700">
                    {formatCurrency(parseFloat(formData.fawry) || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={calculateTotal() === 0}
              >
                حفظ رأس المال الافتتاحي
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard/accounting')}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </form>

        {hasExistingBalances && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              💡 <strong>ملاحظة:</strong> يمكنك إضافة أرصدة افتتاحية إضافية في أي وقت. سيتم إضافتها للأرصدة الموجودة.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

