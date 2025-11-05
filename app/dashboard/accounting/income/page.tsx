'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import { formatCurrency, formatDateTime, paymentMethodLabels } from '@/lib/utils';

export default function IncomePage() {
  const router = useRouter();
  const [income, setIncome] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const columns = [
    {
      key: 'description',
      label: 'الوصف',
      render: (value: string) => (
        <span className="font-medium">{value}</span>
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
      render: (value: string) => {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-semibold mb-2">إجمالي الإيرادات</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalIncome)}</p>
          <p className="text-sm mt-2">{income.length} إيراد</p>
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
    </div>
  );
}

