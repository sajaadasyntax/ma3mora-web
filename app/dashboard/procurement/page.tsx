'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import { formatCurrency, formatDateTime, procOrderStatusLabels } from '@/lib/utils';

export default function ProcurementPage() {
  const { user } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.getProcOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'orderNumber', label: 'رقم الأمر' },
    {
      key: 'supplier',
      label: 'المورد',
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
      key: 'status',
      label: 'حالة الاستلام',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            value === 'RECEIVED'
              ? 'bg-green-100 text-green-800'
              : value === 'PARTIAL'
              ? 'bg-yellow-100 text-yellow-800'
              : value === 'CANCELLED'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {procOrderStatusLabels[value]}
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
        <h1 className="text-3xl font-bold text-gray-900">أوامر الشراء</h1>
        {user?.role === 'PROCUREMENT' && (
          <Button onClick={() => router.push('/dashboard/procurement/new')}>
            إنشاء أمر شراء جديد
          </Button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          data={orders}
          onRowClick={(row) => router.push(`/dashboard/procurement/${row.id}`)}
        />
      </Card>
    </div>
  );
}

