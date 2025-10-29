'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { formatCurrency, formatDateTime, paymentMethodLabels } from '@/lib/utils';

export default function BankTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    method: '',
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.method) params.method = filters.method;

      const data = await api.getBankTransactions(params);
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error loading bank transactions:', error);
      alert('فشل تحميل المعاملات البنكية');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const applyFilters = () => {
    loadTransactions();
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', method: '' });
    setTimeout(() => loadTransactions(), 100);
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SALES_PAYMENT: 'دفعة مبيعات',
      PROCUREMENT_PAYMENT: 'دفعة مشتريات',
      CASH_EXCHANGE: 'صرف نقد/بنك',
      EXPENSE: 'منصرف',
      SALARY: 'راتب',
      ADVANCE: 'سلفية',
    };
    return labels[type] || type;
  };

  const getTransactionDetails = (transaction: any) => {
    switch (transaction.type) {
      case 'SALES_PAYMENT':
        return (
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">رقم الفاتورة:</span> {transaction.details.invoiceNumber}</div>
            <div><span className="font-semibold">العميل:</span> {transaction.details.customer}</div>
            <div><span className="font-semibold">المخزن:</span> {transaction.details.inventory}</div>
            {transaction.details.receiptNumber && (
              <div><span className="font-semibold">رقم الإيصال:</span> {transaction.details.receiptNumber}</div>
            )}
            {transaction.details.receiptUrl && (
              <div>
                <a href={transaction.details.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  عرض الإيصال
                </a>
              </div>
            )}
            {transaction.details.notes && (
              <div><span className="font-semibold">ملاحظات:</span> {transaction.details.notes}</div>
            )}
          </div>
        );
      case 'PROCUREMENT_PAYMENT':
        return (
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">رقم الأمر:</span> {transaction.details.orderNumber}</div>
            <div><span className="font-semibold">المورد:</span> {transaction.details.supplier}</div>
            <div><span className="font-semibold">المخزن:</span> {transaction.details.inventory}</div>
            {transaction.details.receiptNumber && (
              <div><span className="font-semibold">رقم الإيصال:</span> {transaction.details.receiptNumber}</div>
            )}
            {transaction.details.receiptUrl && (
              <div>
                <a href={transaction.details.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  عرض الإيصال
                </a>
              </div>
            )}
            {transaction.details.notes && (
              <div><span className="font-semibold">ملاحظات:</span> {transaction.details.notes}</div>
            )}
          </div>
        );
      case 'CASH_EXCHANGE':
        return (
          <div className="text-sm space-y-1">
            <div>
              <span className="font-semibold">من:</span> {paymentMethodLabels[transaction.details.fromMethod] || transaction.details.fromMethod}
              {' → '}
              <span className="font-semibold">إلى:</span> {paymentMethodLabels[transaction.details.toMethod] || transaction.details.toMethod}
            </div>
            {transaction.details.receiptNumber && (
              <div><span className="font-semibold">رقم الإيصال:</span> {transaction.details.receiptNumber}</div>
            )}
            {transaction.details.receiptUrl && (
              <div>
                <a href={transaction.details.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  عرض الإيصال
                </a>
              </div>
            )}
            {transaction.details.notes && (
              <div><span className="font-semibold">ملاحظات:</span> {transaction.details.notes}</div>
            )}
          </div>
        );
      case 'EXPENSE':
        return (
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">الوصف:</span> {transaction.details.description}</div>
            {transaction.details.inventory && (
              <div><span className="font-semibold">المخزن:</span> {transaction.details.inventory}</div>
            )}
            {transaction.details.section && (
              <div><span className="font-semibold">القسم:</span> {transaction.details.section === 'GROCERY' ? 'بقالة' : 'أفران'}</div>
            )}
          </div>
        );
      case 'SALARY':
        return (
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">الموظف:</span> {transaction.details.employee} ({transaction.details.position})</div>
            <div><span className="font-semibold">الشهر:</span> {transaction.details.month}/{transaction.details.year}</div>
            {transaction.details.notes && (
              <div><span className="font-semibold">ملاحظات:</span> {transaction.details.notes}</div>
            )}
          </div>
        );
      case 'ADVANCE':
        return (
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">الموظف:</span> {transaction.details.employee} ({transaction.details.position})</div>
            <div><span className="font-semibold">السبب:</span> {transaction.details.reason}</div>
            {transaction.details.notes && (
              <div><span className="font-semibold">ملاحظات:</span> {transaction.details.notes}</div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">المعاملات البنكية</h1>
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/accounting')}
        >
          العودة للمحاسبة
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-sm font-semibold mb-1">إجمالي بنكك</h3>
            <p className="text-2xl font-bold">{formatCurrency(parseFloat(summary.BANK))}</p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <h3 className="text-sm font-semibold mb-1">إجمالي بنك النيل</h3>
            <p className="text-2xl font-bold">{formatCurrency(parseFloat(summary.BANK_NILE))}</p>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-sm font-semibold mb-1">الإجمالي</h3>
            <p className="text-2xl font-bold">{formatCurrency(parseFloat(summary.total))}</p>
          </Card>

          <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
            <h3 className="text-sm font-semibold mb-1">عدد المعاملات</h3>
            <p className="text-2xl font-bold">{summary.count}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">فلترة المعاملات</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="من تاريخ"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />

          <Input
            label="إلى تاريخ"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />

          <Select
            label="طريقة الدفع"
            value={filters.method}
            onChange={(e) => handleFilterChange('method', e.target.value)}
            options={[
              { value: '', label: 'الكل' },
              { value: 'BANK', label: 'بنكك' },
              { value: 'BANK_NILE', label: 'بنك النيل' },
            ]}
          />

          <div className="flex gap-2 items-end">
            <Button onClick={applyFilters}>تطبيق الفلترة</Button>
            <Button variant="secondary" onClick={clearFilters}>مسح</Button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">قائمة المعاملات</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد معاملات بنكية في الفترة المحددة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    طريقة الدفع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المسجل بواسطة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التفاصيل
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTransactionTypeLabel(transaction.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {paymentMethodLabels[transaction.method] || transaction.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(parseFloat(transaction.amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.recordedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getTransactionDetails(transaction)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary by Type */}
      {summary && summary.byType && Object.keys(summary.byType).length > 0 && (
        <Card className="mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ملخص حسب النوع</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(summary.byType).map(([type, amount]: [string, any]) => (
              <div key={type} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">{getTransactionTypeLabel(type)}</div>
                <div className="text-lg font-semibold text-gray-900">{formatCurrency(parseFloat(amount))}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

