'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { formatCurrency } from '@/lib/utils';

export default function NewExpensePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    method: 'CASH',
    description: '',
    isDebt: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (!formData.description.trim()) {
      alert('يرجى إدخال وصف المنصرف');
      return;
    }

    setSubmitting(true);
    try {
      await api.createExpense({
        amount: parseFloat(formData.amount),
        method: formData.method,
        description: formData.description,
        isDebt: formData.isDebt,
      });

      alert('✅ تم إضافة المنصرف بنجاح!');
      router.push('/dashboard/accounting');
    } catch (error: any) {
      alert(error.message || 'فشل إضافة المنصرف');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">إضافة منصرف جديد</h1>
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/accounting')}
        >
          العودة للمحاسبة
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                  <Input
                    label="💰 مبلغ المنصرف"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="أدخل المبلغ"
                    required
                  />
                </div>

                <Input
                  label="📝 وصف المنصرف"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="مثال: رواتب، فواتير كهرباء، صيانة، إلخ..."
                  required
                />

                <Select
                  label="🏦 طريقة الدفع"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  options={[
                    { value: 'CASH', label: '💵 كاش' },
                    { value: 'BANK', label: '🏦 بنكك' },
                    { value: 'BANK_NILE', label: '🏦 بنك النيل' },
                  ]}
                />

                <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <input
                    type="checkbox"
                    id="isDebt"
                    checked={formData.isDebt}
                    onChange={(e) => setFormData({ ...formData, isDebt: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="isDebt" className="text-sm font-medium text-purple-900 cursor-pointer">
                    📊 تسجيل كدين (لن يحسب في الرصيد السائل)
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? 'جاري الحفظ...' : 'حفظ المنصرف'}
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
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <h3 className="text-lg font-semibold mb-4 text-orange-900">ملخص المنصرف</h3>
            
            <div className="space-y-3">
              <div className="bg-white p-3 rounded">
                <p className="text-sm text-gray-600">المبلغ</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formData.amount ? formatCurrency(parseFloat(formData.amount)) : formatCurrency(0)}
                </p>
              </div>

              <div className="bg-white p-3 rounded">
                <p className="text-sm text-gray-600">طريقة الدفع</p>
                <p className="font-semibold">
                  {formData.method === 'CASH' ? '💵 كاش' : formData.method === 'BANK' ? '🏦 بنكك' : '🏦 بنك النيل'}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                💡 <strong>ملاحظة:</strong> {formData.isDebt ? 'هذا المنصرف مسجل كدين ولن يؤثر على الرصيد السائل' : 'سيتم خصم هذا المنصرف من الرصيد الصافي للنظام'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

