'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import {
  formatCurrency,
  formatDateTime,
  paymentStatusLabels,
  deliveryStatusLabels,
  paymentMethodLabels,
  sectionLabels,
} from '@/lib/utils';

interface PageProps {
  params: {
    id: string;
  };
}

export default function SalesInvoiceDetailPage({ params }: PageProps) {
  const { user } = useUser();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'CASH',
    notes: '',
  });

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  const loadInvoice = async () => {
    try {
      const data = await api.getSalesInvoice(params.id);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('فشل تحميل الفاتورة');
      router.push('/dashboard/sales');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirm('هل أنت متأكد من تأكيد دفع هذه الفاتورة؟')) {
      return;
    }

    setConfirmingPayment(true);
    try {
      await api.confirmInvoicePayment(params.id);
      await loadInvoice();
      alert('تم تأكيد الدفع بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل تأكيد الدفع');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      await api.addPayment(params.id, {
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        notes: paymentData.notes,
      });
      setShowPaymentForm(false);
      setPaymentData({ amount: '', method: 'CASH', notes: '' });
      await loadInvoice();
      alert('تم تسجيل الدفعة بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل تسجيل الدفعة');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeliver = async () => {
    if (!confirm('هل أنت متأكد من تسليم هذه الفاتورة؟')) {
      return;
    }

    setDelivering(true);
    try {
      await api.deliverInvoice(params.id);
      await loadInvoice();
      alert('تم تسليم الفاتورة بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل تسليم الفاتورة');
    } finally {
      setDelivering(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!invoice) {
    return <div className="text-center py-8">الفاتورة غير موجودة</div>;
  }

  const remainingAmount = parseFloat(invoice.total) - parseFloat(invoice.paidAmount);

  const itemColumns = [
    {
      key: 'item',
      label: 'الصنف',
      render: (value: any) => value.name,
    },
    { key: 'quantity', label: 'الكمية' },
    { key: 'giftQty', label: 'الكمية المجانية' },
    {
      key: 'unitPrice',
      label: 'السعر',
      render: (value: any) => formatCurrency(value),
    },
    {
      key: 'lineTotal',
      label: 'المجموع',
      render: (value: any) => formatCurrency(value),
    },
  ];

  const paymentColumns = [
    {
      key: 'paidAt',
      label: 'التاريخ',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'amount',
      label: 'المبلغ',
      render: (value: any) => formatCurrency(value),
    },
    {
      key: 'method',
      label: 'طريقة الدفع',
      render: (value: string) => paymentMethodLabels[value] || value,
    },
    { key: 'notes', label: 'ملاحظات' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="secondary" onClick={() => router.push('/dashboard/sales')}>
            ← رجوع
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Invoice Info */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">فاتورة رقم {invoice.invoiceNumber}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">العميل</p>
              <p className="font-semibold">{invoice.customer.name}</p>
            </div>
            <div>
              <p className="text-gray-600">المخزن</p>
              <p className="font-semibold">{invoice.inventory.name}</p>
            </div>
            <div>
              <p className="text-gray-600">القسم</p>
              <p className="font-semibold">{sectionLabels[invoice.section]}</p>
            </div>
            <div>
              <p className="text-gray-600">التاريخ</p>
              <p className="font-semibold">{formatDateTime(invoice.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-600">حالة الدفع</p>
              <span
                className={`inline-block px-2 py-1 rounded text-sm ${
                  invoice.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-800'
                    : invoice.paymentStatus === 'PARTIAL'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {paymentStatusLabels[invoice.paymentStatus]}
              </span>
            </div>
            <div>
              <p className="text-gray-600">حالة التسليم</p>
              <span
                className={`inline-block px-2 py-1 rounded text-sm ${
                  invoice.deliveryStatus === 'DELIVERED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {deliveryStatusLabels[invoice.deliveryStatus]}
              </span>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">حالة تأكيد الدفع</p>
              {invoice.paymentConfirmed ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block px-3 py-1 rounded bg-green-100 text-green-800 text-sm font-semibold">
                    ✓ تم تأكيد الدفع
                  </span>
                  {invoice.paymentConfirmedByUser && (
                    <span className="text-sm text-gray-600">
                      بواسطة: {invoice.paymentConfirmedByUser.username} - {formatDateTime(invoice.paymentConfirmedAt)}
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
          <Table columns={itemColumns} data={invoice.items} />
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-end gap-8 text-lg">
              <div>
                <p className="text-gray-600">المجموع الفرعي:</p>
                <p className="text-gray-600">الخصم:</p>
                <p className="font-bold">المجموع الكلي:</p>
                <p className="text-gray-600">المدفوع:</p>
                <p className="font-bold text-red-600">المتبقي:</p>
              </div>
              <div className="text-right">
                <p>{formatCurrency(invoice.subtotal)}</p>
                <p>{formatCurrency(invoice.discount)}</p>
                <p className="font-bold">{formatCurrency(invoice.total)}</p>
                <p>{formatCurrency(invoice.paidAmount)}</p>
                <p className="font-bold text-red-600">{formatCurrency(remainingAmount)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payments */}
        {invoice.payments && invoice.payments.length > 0 && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">الدفعات</h3>
            <Table columns={paymentColumns} data={invoice.payments} />
          </Card>
        )}

        {/* Actions */}
        {user?.role === 'ACCOUNTANT' && !invoice.paymentConfirmed && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">تأكيد الدفع</h3>
            <p className="text-gray-600 mb-4">
              قم بتأكيد دفع الفاتورة لتمكين موظف المخازن من تسليم البضاعة
            </p>
            <Button 
              onClick={handleConfirmPayment}
              disabled={confirmingPayment}
            >
              {confirmingPayment ? 'جاري التأكيد...' : '✓ تأكيد الدفع'}
            </Button>
          </Card>
        )}

        <Card>
          <h3 className="text-xl font-semibold mb-4">الإجراءات</h3>
          <div className="flex gap-4">
            {(user?.role === 'ACCOUNTANT' || user?.role === 'SALES_GROCERY' || user?.role === 'SALES_BAKERY') &&
              invoice.paymentStatus !== 'PAID' &&
              remainingAmount > 0 && (
                <Button 
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  disabled={submittingPayment}
                >
                  {showPaymentForm ? 'إلغاء' : 'تسجيل دفعة'}
                </Button>
              )}

            {user?.role === 'INVENTORY' && invoice.deliveryStatus === 'NOT_DELIVERED' && (
              <>
                {!invoice.paymentConfirmed ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-800 font-semibold">⏳ في انتظار تأكيد الدفع</p>
                    <p className="text-orange-700 text-sm mt-1">
                      لا يمكن تسليم البضاعة قبل تأكيد المحاسب للدفع
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleDeliver}
                    disabled={delivering}
                  >
                    {delivering ? 'جاري التسليم...' : 'تسليم الفاتورة'}
                  </Button>
                )}
              </>
            )}
          </div>

          {showPaymentForm && (
            <form onSubmit={handlePayment} className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-3">تسجيل دفعة جديدة</h4>
              <Input
                label={`المبلغ (الحد الأقصى: ${formatCurrency(remainingAmount)})`}
                type="number"
                step="0.01"
                max={remainingAmount}
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                required
              />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  طريقة الدفع
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                >
                  <option value="CASH">نقدي</option>
                  <option value="BANK">بنك</option>
                </select>
              </div>
              <Input
                label="ملاحظات (اختياري)"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button 
                  type="submit"
                  disabled={submittingPayment}
                >
                  {submittingPayment ? 'جاري الحفظ...' : 'حفظ الدفعة'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setPaymentData({ amount: '', method: 'CASH', notes: '' });
                  }}
                  disabled={submittingPayment}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          )}
        </Card>

        {invoice.notes && (
          <Card>
            <h3 className="text-xl font-semibold mb-2">ملاحظات</h3>
            <p className="text-gray-700">{invoice.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

