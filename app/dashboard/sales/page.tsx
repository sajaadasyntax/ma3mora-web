'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import {
  formatCurrency,
  formatDateTime,
  paymentStatusLabels,
  deliveryStatusLabels,
} from '@/lib/utils';

export default function SalesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await api.getSalesInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'invoiceNumber', label: 'رقم الفاتورة' },
    {
      key: 'customer',
      label: 'العميل',
      render: (value: any) => value.name,
    },
    {
      key: 'inventory',
      label: 'المخزن',
      render: (value: any) => value.name,
    },
    {
      key: 'total',
      label: 'المجموع',
      render: (value: any) => formatCurrency(value),
    },
    {
      key: 'paymentConfirmed',
      label: 'تأكيد الدفع',
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            value ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}
        >
          {value ? '✓ مؤكد' : '⏳ معلق'}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'حالة الدفع',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            value === 'PAID'
              ? 'bg-green-100 text-green-800'
              : value === 'PARTIAL'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {paymentStatusLabels[value]}
        </span>
      ),
    },
    {
      key: 'deliveryStatus',
      label: 'حالة التسليم',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            value === 'DELIVERED'
              ? 'bg-green-100 text-green-800'
              : 'bg-orange-100 text-orange-800'
          }`}
        >
          {deliveryStatusLabels[value]}
        </span>
      ),
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
        <h1 className="text-3xl font-bold text-gray-900">فواتير المبيعات</h1>
        {(user?.role === 'SALES_GROCERY' || user?.role === 'SALES_BAKERY') && (
          <Button onClick={() => router.push('/dashboard/sales/new')}>
            إنشاء فاتورة جديدة
          </Button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          data={invoices}
          onRowClick={(row) => router.push(`/dashboard/sales/${row.id}`)}
        />
      </Card>
    </div>
  );
}

