'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import { formatCurrency, formatDateTime, paymentMethodLabels } from '@/lib/utils';

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const columns = [
    {
      key: 'type',
      label: 'النوع',
      render: (value: string, row: any) => {
        const typeLabels: Record<string, { label: string; color: string }> = {
          EXPENSE: { label: 'منصرف', color: 'bg-orange-100 text-orange-800' },
          SALARY: { label: 'راتب', color: 'bg-blue-100 text-blue-800' },
          ADVANCE: { label: 'سلفية', color: 'bg-purple-100 text-purple-800' },
        };
        const typeInfo = typeLabels[value] || { label: value, color: 'bg-gray-100 text-gray-800' };
        return (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
        );
      },
    },
    {
      key: 'description',
      label: 'الوصف',
      render: (value: string, row: any) => (
        <div>
          <span className="font-medium">{value}</span>
          {row.employee && (
            <span className="text-sm text-gray-500 block mt-1">
              {row.employee.name} {row.employee.position ? `- ${row.employee.position}` : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'المبلغ',
      render: (value: any) => (
        <span className="font-semibold text-orange-600">
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
        <h1 className="text-3xl font-bold text-gray-900">المنصرفات</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard/accounting/expenses/new')}>
            إضافة منصرف جديد
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
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <h3 className="text-lg font-semibold mb-2">إجمالي المنصرفات</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
          <p className="text-sm mt-2">{expenses.length} منصرف</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-semibold mb-2">دفع كاش</h3>
          <p className="text-3xl font-bold">
            {formatCurrency(
              expenses
                .filter((e) => e.method === 'CASH')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0)
            )}
          </p>
          <p className="text-sm mt-2">
            {expenses.filter((e) => e.method === 'CASH').length} منصرف
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-lg font-semibold mb-2">دفع بنكك</h3>
          <p className="text-3xl font-bold">
            {formatCurrency(
              expenses
                .filter((e) => e.method === 'BANK')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0)
            )}
          </p>
          <p className="text-sm mt-2">
            {expenses.filter((e) => e.method === 'BANK').length} منصرف
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">دفع بنك النيل</h3>
          <p className="text-3xl font-bold">
            {formatCurrency(
              expenses
                .filter((e) => e.method === 'BANK_NILE')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0)
            )}
          </p>
          <p className="text-sm mt-2">
            {expenses.filter((e) => e.method === 'BANK_NILE').length} منصرف
          </p>
        </Card>
      </div>

      <Card>
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">لا توجد منصرفات مسجلة</p>
            <Button onClick={() => router.push('/dashboard/accounting/expenses/new')}>
              إضافة منصرف جديد
            </Button>
          </div>
        ) : (
          <Table columns={columns} data={expenses} />
        )}
      </Card>
    </div>
  );
}

