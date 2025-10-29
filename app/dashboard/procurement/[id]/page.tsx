'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
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
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    notes: '',
    partial: false,
    batches: [] as Array<{ itemId: string; quantity: number; expiryDate: string; notes?: string }>,
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'CASH',
    notes: '',
    receiptNumber: '',
    receiptUrl: '',
  });
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    reason: '',
    notes: '',
    refundMethod: '',
    refundAmount: '',
    refundNotes: '',
  });
  const [cancelling, setCancelling] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnForm, setReturnForm] = useState({
    reason: '',
    notes: '',
  });
  const [showGiftsForm, setShowGiftsForm] = useState(false);
  const [giftsForm, setGiftsForm] = useState<Array<{ itemId: string; giftQty: number }>>([]);
  const [addingGifts, setAddingGifts] = useState(false);

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

  const handleReceive = async () => {
    setReceiving(true);
    try {
      const batches = receiveForm.batches.map(batch => ({
        itemId: batch.itemId,
        quantity: batch.quantity,
        expiryDate: batch.expiryDate || null,
        notes: batch.notes || undefined,
      }));

      await api.receiveOrder(params.id, receiveForm.notes, receiveForm.partial, batches.length > 0 ? batches : undefined);
      setReceiveForm({
        notes: '',
        partial: false,
        batches: [],
      });
      setShowReceiveForm(false);
      await loadOrder();
      alert('تم استلام الأمر بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل استلام الأمر');
    } finally {
      setReceiving(false);
    }
  };

  const initializeReceiveForm = (partial: boolean) => {
    const batches = order.items.map((item: any) => ({
      itemId: item.itemId,
      quantity: parseFloat(item.quantity.toString()),
      expiryDate: '',
      notes: '',
    }));
    setReceiveForm({
      notes: '',
      partial,
      batches,
    });
    setShowReceiveForm(true);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addProcOrderPayment(params.id, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        notes: paymentForm.notes,
        receiptUrl: paymentForm.receiptUrl || undefined,
        receiptNumber: paymentForm.method !== 'CASH' ? paymentForm.receiptNumber : undefined,
      });
      setPaymentForm({ amount: '', method: 'CASH', notes: '', receiptNumber: '', receiptUrl: '' });
      setReceiptImage(null);
      setShowPaymentForm(false);
      await loadOrder();
      alert('تم إضافة الدفعة بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل إضافة الدفعة');
    }
  };

  const handleReceiptImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptImage(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('الرجاء اختيار صورة صحيحة');
      return;
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('حجم الصورة كبير. الحد الأقصى 2 ميغابايت');
      return;
    }
    setUploadError('');
    setReceiptImage(file);
    try {
      const result = await api.uploadFile(file as any);
      setPaymentForm({ ...paymentForm, receiptUrl: result.url });
    } catch (err: any) {
      setUploadError(err.message || 'فشل رفع الصورة');
      setReceiptImage(null);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if order has payments and refund info is required
    const hasPayments = order && parseFloat(order.paidAmount || 0) > 0;
    if (hasPayments && (!cancelForm.refundMethod || !cancelForm.refundAmount)) {
      alert('يجب تحديد طريقة ومبلغ استرجاع المبلغ لأن الأمر مدفوع');
      return;
    }

    if (!confirm('هل أنت متأكد من إلغاء هذا الأمر؟')) {
      return;
    }
    setCancelling(true);
    try {
      const cancelData: any = {
        reason: cancelForm.reason,
        notes: cancelForm.notes,
      };
      
      if (hasPayments) {
        cancelData.refundMethod = cancelForm.refundMethod;
        cancelData.refundAmount = parseFloat(cancelForm.refundAmount);
        cancelData.refundNotes = cancelForm.refundNotes;
      }

      await api.cancelProcOrder(params.id, cancelData);
      setCancelForm({ reason: '', notes: '', refundMethod: '', refundAmount: '', refundNotes: '' });
      setShowCancelForm(false);
      await loadOrder();
      alert('تم إلغاء الأمر بنجاح');
    } catch (error: any) {
      if (error.error && error.required) {
        alert(`خطأ: ${error.error}\nالحقول المطلوبة: ${error.required.join(', ')}`);
      } else {
        alert(error.message || error.error || 'فشل إلغاء الأمر');
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('هل أنت متأكد من إرجاع هذا الأمر؟')) {
      return;
    }
    try {
      await api.returnProcOrder(params.id, returnForm);
      setReturnForm({ reason: '', notes: '' });
      setShowReturnForm(false);
      await loadOrder();
      alert('تم إرجاع الأمر بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل إرجاع الأمر');
    }
  };

  const initializeGiftsForm = () => {
    const gifts = order.items.map((item: any) => ({
      itemId: item.itemId,
      giftQty: parseFloat(item.giftQty?.toString() || '0'),
    }));
    setGiftsForm(gifts);
    setShowGiftsForm(true);
  };

  const handleAddGifts = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingGifts(true);
    try {
      const gifts = giftsForm.filter(g => g.giftQty > 0);
      if (gifts.length === 0) {
        alert('يرجى إدخال كمية هدية واحدة على الأقل');
        setAddingGifts(false);
        return;
      }
      await api.addProcOrderGifts(params.id, gifts);
      setShowGiftsForm(false);
      setGiftsForm([]);
      await loadOrder();
      alert('تم إضافة الهدايا بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل إضافة الهدايا');
    } finally {
      setAddingGifts(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!order) {
    return <div className="text-center py-8">أمر الشراء غير موجود</div>;
  }

  // Calculate received quantities per item from all receipts
  const getReceivedQuantities = () => {
    const received: { [itemId: string]: number } = {};
    
    if (order.receipts) {
      order.receipts.forEach((receipt: any) => {
        if (receipt.batches) {
          receipt.batches.forEach((batch: any) => {
            const itemId = batch.itemId;
            const qty = parseFloat(batch.quantity?.toString() || '0');
            received[itemId] = (received[itemId] || 0) + qty;
          });
        }
      });
    }
    
    return received;
  };

  const receivedQuantities = getReceivedQuantities();

  const itemColumns = [
    {
      key: 'item',
      label: 'الصنف',
      render: (value: any) => value.name,
    },
    { 
      key: 'quantity', 
      label: 'الكمية المطلوبة',
      render: (value: any, row: any) => {
        const giftQty = parseFloat(row.giftQty?.toString() || '0');
        const orderedQty = parseFloat(value?.toString() || '0');
        if (giftQty > 0) {
          return (
            <div>
              <span>{formatNumber(orderedQty)}</span>
              <span className="text-green-600 text-sm mr-2"> + {formatNumber(giftQty)} هدية</span>
            </div>
          );
        }
        return formatNumber(orderedQty);
      },
    },
    {
      key: 'quantity',
      label: 'المستلم',
      render: (value: any, row: any) => {
        const itemId = row.itemId;
        const received = receivedQuantities[itemId] || 0;
        const giftQty = parseFloat(row.giftQty?.toString() || '0');
        const orderedQty = parseFloat(value?.toString() || '0');
        const totalOrdered = orderedQty + giftQty;
        
        if (received === 0) {
          return <span className="text-red-600 font-semibold">0</span>;
        } else if (received >= totalOrdered) {
          return <span className="text-green-600 font-semibold">{formatNumber(received)} ✓</span>;
        } else {
          return <span className="text-orange-600 font-semibold">{formatNumber(received)}</span>;
        }
      },
    },
    {
      key: 'quantity',
      label: 'المتبقي',
      render: (value: any, row: any) => {
        const itemId = row.itemId;
        const received = receivedQuantities[itemId] || 0;
        const giftQty = parseFloat(row.giftQty?.toString() || '0');
        const orderedQty = parseFloat(value?.toString() || '0');
        const totalOrdered = orderedQty + giftQty;
        const pending = Math.max(0, totalOrdered - received);
        
        if (pending === 0) {
          return <span className="text-green-600 font-semibold">0 ✓</span>;
        } else {
          return <span className="text-red-600 font-semibold">{formatNumber(pending)}</span>;
        }
      },
    },
    {
      key: 'quantity',
      label: 'حالة التسليم',
      render: (value: any, row: any) => {
        const itemId = row.itemId;
        const received = receivedQuantities[itemId] || 0;
        const giftQty = parseFloat(row.giftQty?.toString() || '0');
        const orderedQty = parseFloat(value?.toString() || '0');
        const totalOrdered = orderedQty + giftQty;
        const pending = totalOrdered - received;
        
        if (received === 0) {
          return (
            <span className="inline-block px-2 py-1 rounded text-xs bg-red-100 text-red-800 font-semibold">
              غير مستلم
            </span>
          );
        } else if (pending <= 0) {
          return (
            <span className="inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-800 font-semibold">
              ✓ مستلم كامل
            </span>
          );
        } else {
          return (
            <span className="inline-block px-2 py-1 rounded text-xs bg-orange-100 text-orange-800 font-semibold">
              مستلم جزئي
            </span>
          );
        }
      },
    },
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

  const paymentColumns = [
    {
      key: 'paidAt',
      label: 'تاريخ الدفع',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'amount',
      label: 'المبلغ',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'method',
      label: 'طريقة الدفع',
      render: (value: string) => {
        const methods = { CASH: 'كاش', BANK: 'بنكك', BANK_NILE: 'بنك النيل' };
        return methods[value as keyof typeof methods] || value;
      },
    },
    {
      key: 'receiptNumber',
      label: 'رقم الإيصال',
      render: (value: any, row: any) => row.receiptNumber || '-',
    },
    {
      key: 'receiptUrl',
      label: 'الإيصال',
      render: (value: any, row: any) =>
        row.receiptUrl ? (
          <a
            href={row.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            عرض الإيصال
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'recordedByUser',
      label: 'سجل بواسطة',
      render: (value: any) => value.username,
    },
    { key: 'notes', label: 'ملاحظات' },
  ];

  const returnColumns = [
    {
      key: 'returnedAt',
      label: 'تاريخ الإرجاع',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'reason',
      label: 'السبب',
    },
    {
      key: 'returnedByUser',
      label: 'أرجع بواسطة',
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
              <p className="text-gray-600">حالة الدفع</p>
              <div className="mt-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">المجموع: {formatCurrency(order.total)}</span>
                  <span className="text-sm text-green-600">المدفوع: {formatCurrency(order.paidAmount || 0)}</span>
                  <span className="text-sm text-red-600">المتبقي: {formatCurrency((order.total - (order.paidAmount || 0)))}</span>
                </div>
                {order.paymentConfirmed ? (
                  <div className="flex items-center gap-2">
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
                    ⏳ في انتظار تأكيد الدفع من المدير
                  </span>
                )}
              </div>
            </div>
            {order.status === 'CANCELLED' && order.refundMethod && order.refundAmount && (
              <div className="col-span-2 border-t pt-4 mt-2">
                <p className="text-gray-600 mb-2">معلومات الاسترجاع</p>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm font-semibold text-red-800">
                      مبلغ الاسترجاع: {formatCurrency(parseFloat(order.refundAmount))}
                    </span>
                    <span className="text-sm text-gray-700">
                      طريقة الاسترجاع: {order.refundMethod === 'CASH' ? 'كاش' : order.refundMethod === 'BANK' ? 'بنكك' : 'بنك النيل'}
                    </span>
                  </div>
                  {order.refundNotes && (
                    <p className="text-sm text-gray-700 mt-2">ملاحظات: {order.refundNotes}</p>
                  )}
                  {order.refundedByUser && (
                    <p className="text-sm text-gray-600 mt-2">
                      تم الاسترجاع بواسطة: {order.refundedByUser.username} - {formatDateTime(order.refundedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">الأصناف</h3>
            {order.receipts && order.receipts.length > 0 && (
              <div className="text-sm text-gray-600">
                {order.status === 'RECEIVED' ? (
                  <span className="px-3 py-1 rounded bg-green-100 text-green-800 font-semibold">
                    ✓ جميع الأصناف مستلمة
                  </span>
                ) : order.status === 'PARTIAL' ? (
                  <span className="px-3 py-1 rounded bg-orange-100 text-orange-800 font-semibold">
                    ⚠ استلام جزئي ({order.receipts.length} استلام)
                  </span>
                ) : null}
              </div>
            )}
          </div>
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

        {/* Payments */}
        {order.payments && order.payments.length > 0 && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">المدفوعات</h3>
              {user?.role === 'MANAGER' && (
                <Button onClick={() => setShowPaymentForm(true)}>
                  إضافة دفعة
                </Button>
              )}
            </div>
            <Table columns={paymentColumns} data={order.payments} />
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between gap-8 text-lg">
                <div>
                  <p className="font-bold">المجموع الكلي:</p>
                  <p className="font-bold">المدفوع:</p>
                  <p className="font-bold">المتبقي:</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(order.total)}</p>
                  <p className="font-bold text-green-600">{formatCurrency(order.paidAmount || 0)}</p>
                  <p className="font-bold text-red-600">{formatCurrency((order.total - (order.paidAmount || 0)))}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Add Payment Form */}
        {user?.role === 'MANAGER' && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">إضافة دفعة</h3>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <Input
                label="المبلغ"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required
              />
              <Select
                label="طريقة الدفع"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                options={[
                  { value: 'CASH', label: 'كاش' },
                  { value: 'BANK', label: 'بنكك' },
                  { value: 'BANK_NILE', label: 'بنك النيل' },
                ]}
                required
              />
              {paymentForm.method !== 'CASH' && (
                <>
                  <Input
                    label="رقم الإيصال (مطلوب)"
                    value={paymentForm.receiptNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receiptNumber: e.target.value })}
                    placeholder="أدخل رقم الإيصال"
                    required
                  />
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      صورة الإيصال (اختياري)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                {uploadError && (
                  <div className="mt-2 text-sm text-red-600">{uploadError}</div>
                )}
                    {receiptImage && paymentForm.receiptUrl && (
                      <div className="mt-2">
                        <img
                          src={paymentForm.receiptUrl}
                          alt="Receipt preview"
                          className="max-w-xs max-h-48 object-contain border rounded"
                        />
                      </div>
                    )}
                  </div>
                  <Input
                    label="رابط الإيصال (اختياري إذا تم رفع صورة)"
                    value={paymentForm.receiptUrl}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receiptUrl: e.target.value })}
                    placeholder="أدخل رابط الإيصال"
                  />
                </>
              )}
              <Input
                label="ملاحظات"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit">إضافة الدفعة</Button>
                <Button type="button" variant="secondary" onClick={() => setShowPaymentForm(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Returns */}
        {order.returns && order.returns.length > 0 && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">سجلات الإرجاع</h3>
            <Table columns={returnColumns} data={order.returns} />
          </Card>
        )}

        {/* Cancel Form */}
        {user?.role === 'MANAGER' && order.status !== 'CANCELLED' && order.status !== 'RECEIVED' && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">إلغاء الأمر</h3>
              {!showCancelForm && (
                <Button 
                  variant="danger" 
                  onClick={() => setShowCancelForm(true)}
                >
                  إلغاء الأمر
                </Button>
              )}
            </div>
            {showCancelForm && (
              <form onSubmit={handleCancel} className="space-y-4">
                <Input
                  label="السبب (اختياري)"
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                  placeholder="سبب الإلغاء..."
                />
                <Input
                  label="ملاحظات (اختياري)"
                  value={cancelForm.notes}
                  onChange={(e) => setCancelForm({ ...cancelForm, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                />
                {parseFloat(order.paidAmount || 0) > 0 && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3 text-red-600">معلومات استرجاع المبلغ</h4>
                      <Select
                        label="طريقة استرجاع المبلغ *"
                        value={cancelForm.refundMethod}
                        onChange={(e) => setCancelForm({ ...cancelForm, refundMethod: e.target.value })}
                        options={[
                          { value: 'CASH', label: 'كاش' },
                          { value: 'BANK', label: 'بنكك' },
                          { value: 'BANK_NILE', label: 'بنك النيل' },
                        ]}
                        required
                      />
                      <Input
                        label={`مبلغ الاسترجاع * (المدفوع: ${formatCurrency(parseFloat(order.paidAmount || 0))})`}
                        type="number"
                        step="0.01"
                        min="0"
                        max={order.paidAmount}
                        value={cancelForm.refundAmount}
                        onChange={(e) => setCancelForm({ ...cancelForm, refundAmount: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                      <Input
                        label="ملاحظات الاسترجاع (اختياري)"
                        value={cancelForm.refundNotes}
                        onChange={(e) => setCancelForm({ ...cancelForm, refundNotes: e.target.value })}
                        placeholder="ملاحظات حول عملية الاسترجاع..."
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  <Button type="submit" variant="danger" disabled={cancelling}>
                    {cancelling ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => {
                      setShowCancelForm(false);
                      setCancelForm({ reason: '', notes: '', refundMethod: '', refundAmount: '', refundNotes: '' });
                    }}
                    disabled={cancelling}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* Return Form */}
        {user?.role === 'MANAGER' && order.paidAmount === 0 && !order.returns?.length && order.status !== 'CANCELLED' && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">إرجاع الأمر</h3>
            <form onSubmit={handleReturn} className="space-y-4">
              <Input
                label="السبب"
                value={returnForm.reason}
                onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                required
              />
              <Input
                label="ملاحظات"
                value={returnForm.notes}
                onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit" variant="danger">إرجاع الأمر</Button>
                <Button type="button" variant="secondary" onClick={() => setShowReturnForm(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Receipts */}
        {order.receipts && order.receipts.length > 0 && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">سجلات الاستلام ({order.receipts.length})</h3>
            {order.receipts.map((receipt: any, idx: number) => (
              <div key={receipt.id} className={`mb-6 ${idx < order.receipts.length - 1 ? 'border-b pb-6' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold">
                      استلام #{idx + 1} - {formatDateTime(receipt.receivedAt)}
                    </p>
                    <p className="text-sm text-gray-600">
                      بواسطة: {receipt.receivedByUser?.username}
                      {receipt.notes && ` - ${receipt.notes}`}
                    </p>
                  </div>
                </div>
                {receipt.batches && receipt.batches.length > 0 && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-sm">الأصناف المستلمة في هذا الاستلام:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {receipt.batches.map((batch: any) => (
                        <div key={batch.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                          <span className="font-medium">{batch.item?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-semibold">{formatNumber(batch.quantity)}</span>
                            {batch.expiryDate && (
                              <span className="text-xs text-gray-500">
                                (انتهاء: {new Date(batch.expiryDate).toLocaleDateString('ar-EG')})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}

        {/* Actions */}
        {user?.role === 'MANAGER' && !order.paymentConfirmed && (
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

        {/* Add Gifts - removed: gifts are specified at order creation */}

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
                <div className="space-y-4">
                  {!showReceiveForm ? (
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => initializeReceiveForm(false)}
                      >
                        استلام كامل
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => initializeReceiveForm(true)}
                      >
                        استلام جزئي
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          {receiveForm.partial ? 'استلام جزئي' : 'استلام كامل'}
                        </h4>
                        <p className="text-blue-700 text-sm">
                          أدخل تواريخ انتهاء الصلاحية للأصناف (اختياري)
                        </p>
                      </div>

                      <div className="space-y-3">
                        {receiveForm.batches.map((batch, idx) => {
                          const orderItem = order.items.find((item: any) => item.itemId === batch.itemId);
                          return (
                            <div key={batch.itemId} className="border rounded-lg p-4 bg-gray-50">
                              <h5 className="font-semibold mb-2">
                                {orderItem?.item?.name || batch.itemId}
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    الكمية
                                  </label>
                                  <Input
                                    type="number"
                                    value={batch.quantity}
                                    onChange={(e) => {
                                      const newBatches = [...receiveForm.batches];
                                      const orderedQty = parseFloat(orderItem?.quantity?.toString() || '0');
                                      const giftQty = parseFloat(orderItem?.giftQty?.toString() || '0');
                                      const totalOrdered = orderedQty + giftQty;
                                      const received = receivedQuantities[batch.itemId] || 0;
                                      const remaining = Math.max(0, totalOrdered - received);
                                      const nextVal = Math.max(0, Math.min(remaining, parseFloat(e.target.value) || 0));
                                      newBatches[idx].quantity = nextVal;
                                      setReceiveForm({ ...receiveForm, batches: newBatches });
                                    }}
                                    min="0"
                                    max={(function(){
                                      const orderedQty = parseFloat(orderItem?.quantity?.toString() || '0');
                                      const giftQty = parseFloat(orderItem?.giftQty?.toString() || '0');
                                      const totalOrdered = orderedQty + giftQty;
                                      const received = receivedQuantities[batch.itemId] || 0;
                                      const remaining = Math.max(0, totalOrdered - received);
                                      return remaining;
                                    })()}
                                    required
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    الحد الأقصى المتبقي للاستلام: {
                                      (function(){
                                        const orderedQty = parseFloat(orderItem?.quantity?.toString() || '0');
                                        const giftQty = parseFloat(orderItem?.giftQty?.toString() || '0');
                                        const totalOrdered = orderedQty + giftQty;
                                        const received = receivedQuantities[batch.itemId] || 0;
                                        const remaining = Math.max(0, totalOrdered - received);
                                        return remaining.toFixed(2);
                                      })()
                                    }
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    تاريخ انتهاء الصلاحية (اختياري)
                                  </label>
                                  <Input
                                    type="date"
                                    value={batch.expiryDate}
                                    onChange={(e) => {
                                      const newBatches = [...receiveForm.batches];
                                      newBatches[idx].expiryDate = e.target.value;
                                      setReceiveForm({ ...receiveForm, batches: newBatches });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ملاحظات (اختياري)
                                  </label>
                                  <Input
                                    value={batch.notes || ''}
                                    onChange={(e) => {
                                      const newBatches = [...receiveForm.batches];
                                      newBatches[idx].notes = e.target.value;
                                      setReceiveForm({ ...receiveForm, batches: newBatches });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ملاحظات عامة (اختياري)
                        </label>
                        <Input
                          value={receiveForm.notes}
                          onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                          placeholder="ملاحظات حول الاستلام..."
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleReceive}
                          disabled={receiving}
                        >
                          {receiving ? 'جاري الاستلام...' : 'تأكيد الاستلام'}
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => {
                            setShowReceiveForm(false);
                            setReceiveForm({ notes: '', partial: false, batches: [] });
                          }}
                          disabled={receiving}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}
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

