'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { formatCurrency, formatDateTime, paymentMethodLabels } from '@/lib/utils';

export default function IncomePage() {
  const router = useRouter();
  const { user } = useUser();
  const [income, setIncome] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadIncome();
  }, []);

  const loadIncome = async () => {
    try {
      const data = await api.getIncome();
      setIncome(data);
    } catch (error) {
      console.error('Error loading income:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = income.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
  const debtIncome = income.filter((inc) => inc.isDebt);
  const regularIncome = income.filter((inc) => !inc.isDebt);
  const totalDebt = debtIncome.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);

  const handlePayDebt = async () => {
    if (!selectedDebt) return;
    try {
      setSubmitting(true);
      await api.payInboundDebt(selectedDebt.id, { method: paymentMethod });
      await loadIncome();
      setShowPayModal(false);
      setSelectedDebt(null);
      alert('تم تسديد الدين بنجاح');
    } catch (error: any) {
      console.error('Error paying debt:', error);
      alert(error.message || 'فشل تسديد الدين');
    } finally {
      setSubmitting(false);
    }
  };

  const openPayModal = (debt: any) => {
    setSelectedDebt(debt);
    setPaymentMethod('CASH');
    setShowPayModal(true);
  };

  const columns = [
    {
      key: 'description',
      label: 'الوصف',
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
          {row.isDebt && (
            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
              دين
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'المبلغ',
      render: (value: any) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'طريقة الدفع',
      render: (value: string, row: any) => {
        if (row.isDebt) {
          return <span className="text-gray-500 text-sm">لم يتم الدفع بعد</span>;
        }
        const methodColors: Record<string, string> = {
          CASH: 'bg-green-100 text-green-800',
          BANK: 'bg-blue-100 text-blue-800',
          BANK_NILE: 'bg-purple-100 text-purple-800',
        };
        return (
          <span className={`px-2 py-1 rounded text-sm ${methodColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {paymentMethodLabels[value] || value}
          </span>
        );
      },
    },
    {
      key: 'creator',
      label: 'المستخدم',
      render: (value: any) => value?.username || '-',
    },
    {
      key: 'createdAt',
      label: 'التاريخ',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (_: any, row: any) => {
        if (!row.isDebt) return null;
        if (user?.role !== 'ACCOUNTANT' && user?.role !== 'MANAGER') return null;
        return (
          <Button
            onClick={() => openPayModal(row)}
            className="bg-green-600 hover:bg-green-700 text-sm"
          >
            سداد الدين
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">الإيرادات الأخرى</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard/accounting/income/new')}>
            إضافة إيراد جديد
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/accounting')}
          >
            العودة للمحاسبة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-semibold mb-2">إجمالي الإيرادات</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalIncome)}</p>
          <p className="text-sm mt-2">{income.length} إيراد</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <h3 className="text-lg font-semibold mb-2">الديون الواردة</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalDebt)}</p>
          <p className="text-sm mt-2">{debtIncome.length} دين</p>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <h3 className="text-lg font-semibold mb-2">قبض كاش</h3>
          <p className="text-3xl font-bold">
            {formatCurrency(
              income
                .filter((e) => e.method === 'CASH')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0)
            )}
          </p>
          <p className="text-sm mt-2">
            {income.filter((e) => e.method === 'CASH').length} إيراد
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-lg font-semibold mb-2">قبض بنك</h3>
          <p className="text-3xl font-bold">
            {formatCurrency(
              income
                .filter((e) => e.method === 'BANK')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0)
            )}
          </p>
          <p className="text-sm mt-2">
            {income.filter((e) => e.method === 'BANK').length} إيراد
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">قبض بنك النيل</h3>
          <p className="text-3xl font-bold">
            {formatCurrency(
              income
                .filter((e) => e.method === 'BANK_NILE')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0)
            )}
          </p>
          <p className="text-sm mt-2">
            {income.filter((e) => e.method === 'BANK_NILE').length} إيراد
          </p>
        </Card>
      </div>

      <Card>
        {income.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">لا توجد إيرادات مسجلة</p>
            <Button onClick={() => router.push('/dashboard/accounting/income/new')}>
              إضافة إيراد جديد
            </Button>
          </div>
        ) : (
          <Table columns={columns} data={income} />
        )}
      </Card>

      {/* Pay Debt Modal */}
      {showPayModal && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">سداد الدين</h2>
              <div className="mb-4">
                <p className="text-gray-600 mb-1">الوصف</p>
                <p className="font-semibold">{selectedDebt.description}</p>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 mb-1">المبلغ</p>
                <p className="font-semibold text-green-600 text-xl">
                  {formatCurrency(selectedDebt.amount)}
                </p>
              </div>
              <div className="mb-4">
                <Select
                  label="طريقة الدفع"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={[
                    { value: 'CASH', label: 'كاش' },
                    { value: 'BANK', label: 'بنكك' },
                    { value: 'BANK_NILE', label: 'بنك النيل' },
                  ]}
                  required
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handlePayDebt}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? 'جاري السداد...' : 'تأكيد السداد'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedDebt(null);
                  }}
                  disabled={submitting}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

