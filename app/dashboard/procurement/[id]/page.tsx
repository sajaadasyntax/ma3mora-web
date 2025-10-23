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
  procOrderStatusLabels,
  sectionLabels,
} from '@/lib/utils';
import { generateProcOrderPDF } from '@/lib/pdfUtils';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProcOrderDetailPage({ params }: PageProps) {
  const { user } = useUser();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [receiving, setReceiving] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const data = await api.getProcOrder(params.id);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      alert('فشل تحميل أمر الشراء');
      router.push('/dashboard/procurement');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirm('هل أنت متأكد من تأكيد دفع هذا الأمر؟')) {
      return;
    }

    setConfirmingPayment(true);
    try {
      await api.confirmProcOrderPayment(params.id);
      await loadOrder();
      alert('تم تأكيد الدفع بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل تأكيد الدفع');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleReceive = async (partial = false) => {
    const confirmMsg = partial
      ? 'هل أنت متأكد من استلام هذا الأمر جزئياً؟'
      : 'هل أنت متأكد من استلام هذا الأمر بالكامل؟';

    if (!confirm(confirmMsg)) {
      return;
    }

    setReceiving(true);
    try {
      await api.receiveOrder(params.id, '', partial);
      await loadOrder();
      alert('تم استلام الأمر بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل استلام الأمر');
    } finally {
      setReceiving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!order) {
    return <div className="text-center py-8">أمر الشراء غير موجود</div>;
  }

  const itemColumns = [
    {
      key: 'item',
      label: 'الصنف',
      render: (value: any) => value.name,
    },
    { key: 'quantity', label: 'الكمية' },
    {
      key: 'unitCost',
      label: 'السعر',
      render: (value: any) => formatCurrency(value),
    },
    {
      key: 'lineTotal',
      label: 'المجموع',
      render: (value: any) => formatCurrency(value),
    },
  ];

  const receiptColumns = [
    {
      key: 'receivedAt',
      label: 'تاريخ الاستلام',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'receivedByUser',
      label: 'تم الاستلام بواسطة',
      render: (value: any) => value.username,
    },
    { key: 'notes', label: 'ملاحظات' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/dashboard/procurement')}>
            ← رجوع
          </Button>
          <Button
            onClick={() => generateProcOrderPDF(order)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            📄 تصدير PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Order Info */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">أمر شراء رقم {order.orderNumber}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">المورد</p>
              <p className="font-semibold">{order.supplier.name}</p>
            </div>
            <div>
              <p className="text-gray-600">المخزن</p>
              <p className="font-semibold">{order.inventory.name}</p>
            </div>
            <div>
              <p className="text-gray-600">القسم</p>
              <p className="font-semibold">{sectionLabels[order.section]}</p>
            </div>
            <div>
              <p className="text-gray-600">التاريخ</p>
              <p className="font-semibold">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-600">الحالة</p>
              <span
                className={`inline-block px-2 py-1 rounded text-sm ${
                  order.status === 'RECEIVED'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'PARTIAL'
                    ? 'bg-yellow-100 text-yellow-800'
                    : order.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {procOrderStatusLabels[order.status]}
              </span>
            </div>
            <div>
              <p className="text-gray-600">تم الإنشاء بواسطة</p>
              <p className="font-semibold">{order.creator.username}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">حالة تأكيد الدفع</p>
              {order.paymentConfirmed ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block px-3 py-1 rounded bg-green-100 text-green-800 text-sm font-semibold">
                    ✓ تم تأكيد الدفع
                  </span>
                  {order.paymentConfirmedByUser && (
                    <span className="text-sm text-gray-600">
                      بواسطة: {order.paymentConfirmedByUser.username} - {formatDateTime(order.paymentConfirmedAt)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="inline-block px-3 py-1 rounded bg-orange-100 text-orange-800 text-sm font-semibold">
                  ⏳ في انتظار تأكيد الدفع من المحاسب
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">الأصناف</h3>
          <Table columns={itemColumns} data={order.items} />
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-end gap-8 text-lg">
              <div>
                <p className="font-bold">المجموع الكلي:</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Receipts */}
        {order.receipts && order.receipts.length > 0 && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">سجلات الاستلام</h3>
            <Table columns={receiptColumns} data={order.receipts} />
          </Card>
        )}

        {/* Actions */}
        {user?.role === 'ACCOUNTANT' && !order.paymentConfirmed && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">تأكيد الدفع</h3>
            <p className="text-gray-600 mb-4">
              قم بتأكيد دفع أمر الشراء لتمكين موظف المخازن من استلام البضاعة
            </p>
            <Button 
              onClick={handleConfirmPayment}
              disabled={confirmingPayment}
            >
              {confirmingPayment ? 'جاري التأكيد...' : '✓ تأكيد الدفع'}
            </Button>
          </Card>
        )}

        {user?.role === 'INVENTORY' &&
          order.status !== 'RECEIVED' &&
          order.status !== 'CANCELLED' && (
            <Card>
              <h3 className="text-xl font-semibold mb-4">الإجراءات</h3>
              {!order.paymentConfirmed ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <p className="text-orange-800 font-semibold">⏳ في انتظار تأكيد الدفع</p>
                  <p className="text-orange-700 text-sm mt-1">
                    لا يمكن استلام البضاعة قبل تأكيد المحاسب للدفع
                  </p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button 
                    onClick={() => handleReceive(false)}
                    disabled={receiving}
                  >
                    {receiving ? 'جاري الاستلام...' : 'استلام كامل'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => handleReceive(true)}
                    disabled={receiving}
                  >
                    {receiving ? 'جاري الاستلام...' : 'استلام جزئي'}
                  </Button>
                </div>
              )}
            </Card>
          )}

        {order.notes && (
          <Card>
            <h3 className="text-xl font-semibold mb-2">ملاحظات</h3>
            <p className="text-gray-700">{order.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

