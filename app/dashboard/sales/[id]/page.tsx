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
import { generateInvoicePDF, generateInvoicePDFForAccountant } from '@/lib/pdfUtils';
import { useIsAuditor } from '@/lib/auditorUtils';

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
  const [rejectingInvoice, setRejectingInvoice] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryBatches, setDeliveryBatches] = useState<any>(null);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [deliveryAllocations, setDeliveryAllocations] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'CASH',
    notes: '',
    receiptUrl: '',
    receiptNumber: '',
  });
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [duplicateError, setDuplicateError] = useState<any>(null);
  const isAuditor = useIsAuditor();

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

  const handleRejectInvoice = async () => {
    if (!confirm('هل أنت متأكد من رفض هذه الفاتورة؟')) {
      return;
    }

    setRejectingInvoice(true);
    try {
      await api.rejectInvoice(params.id, rejectNotes || undefined);
      await loadInvoice();
      alert('تم رفض الفاتورة بنجاح');
      setShowRejectForm(false);
      setRejectNotes('');
    } catch (error: any) {
      alert(error.message || 'فشل رفض الفاتورة');
    } finally {
      setRejectingInvoice(false);
    }
  };

  const handleReceiptImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate type and size (<= 2MB)
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
        const result = await api.uploadFile(file);
        setPaymentData({ ...paymentData, receiptUrl: result.url });
      } catch (err: any) {
        setUploadError(err.message || 'فشل رفع الصورة');
        setReceiptImage(null);
      }
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    setDuplicateError(null);
    
    try {
      await api.addPayment(params.id, {
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        notes: paymentData.notes,
        receiptUrl: paymentData.receiptUrl,
        receiptNumber: paymentData.method !== 'CASH' ? paymentData.receiptNumber : undefined,
      });
      setShowPaymentForm(false);
      setPaymentData({ amount: '', method: 'CASH', notes: '', receiptUrl: '', receiptNumber: '' });
      setReceiptImage(null);
      await loadInvoice();
      alert('تم تسجيل الدفعة بنجاح');
    } catch (error: any) {
      // Check if error has existing transaction details
      if (error.existingTransaction) {
        setDuplicateError({ error: error.error || error.message, existingTransaction: error.existingTransaction });
        return;
      }
      alert(error.message || error.error || 'فشل تسجيل الدفعة');
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

  const loadDeliveryBatches = async () => {
    setLoadingBatches(true);
    try {
      const data = await api.getDeliveryBatches(params.id);
      setDeliveryBatches(data);
      setShowDeliveryForm(true);
      // Initialize allocations structure
      const allocations: Record<string, Record<string, Record<string, number>>> = {};
      for (const item of data.items) {
        allocations[item.itemId] = {};
        for (const expiryGroup of item.expiryGroups) {
          allocations[item.itemId][expiryGroup.expiryDate || 'no-expiry'] = {};
          for (const batch of expiryGroup.batches) {
            allocations[item.itemId][expiryGroup.expiryDate || 'no-expiry'][batch.id] = 0;
          }
        }
      }
      setDeliveryAllocations(allocations);
    } catch (error: any) {
      alert(error.message || 'فشل تحميل الدفعات');
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleAllocationChange = (itemId: string, expiryDate: string | null, batchId: string, value: number) => {
    setDeliveryAllocations(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [expiryDate || 'no-expiry']: {
          ...prev[itemId]?.[expiryDate || 'no-expiry'],
          [batchId]: Math.max(0, value),
        },
      },
    }));
  };

  const handlePartialDelivery = async () => {
    if (!deliveryBatches) return;

    // Build delivery payload
    const items: Array<{ itemId: string; allocations: Array<{ batchId: string; quantity: number }>; giftQty?: number }> = [];

    for (const item of deliveryBatches.items) {
      const allocations: Array<{ batchId: string; quantity: number }> = [];
      
      for (const expiryGroup of item.expiryGroups) {
        const expiryKey = expiryGroup.expiryDate || 'no-expiry';
        const itemAllocations = deliveryAllocations[item.itemId]?.[expiryKey] || {};
        
        for (const [batchId, quantity] of Object.entries(itemAllocations)) {
          if (quantity > 0) {
            allocations.push({ batchId, quantity });
          }
        }
      }

      if (allocations.length > 0) {
        items.push({ itemId: item.itemId, allocations });
      }
    }

    if (items.length === 0) {
      alert('الرجاء اختيار الكميات المراد تسليمها');
      return;
    }

    // Validate quantities don't exceed available
    for (const item of deliveryBatches.items) {
      let totalAllocated = 0;
      for (const expiryGroup of item.expiryGroups) {
        const expiryKey = expiryGroup.expiryDate || 'no-expiry';
        const itemAllocations = deliveryAllocations[item.itemId]?.[expiryKey] || {};
        for (const [batchId, quantity] of Object.entries(itemAllocations)) {
          totalAllocated += quantity;
          // Find the batch to check available quantity
          const batch = expiryGroup.batches.find((b: any) => b.id === batchId);
          if (batch && quantity > parseFloat(batch.quantity)) {
            alert(`الكمية المحددة للدفعة ${batchId} تتجاوز الكمية المتوفرة`);
            return;
          }
        }
      }
      const remaining = parseFloat(item.remaining);
      if (totalAllocated > remaining) {
        alert(`الكمية المحددة للصنف ${item.itemName} تتجاوز المتبقي (${remaining})`);
        return;
      }
    }

    setDelivering(true);
    try {
      await api.partialDeliverInvoice(params.id, {
        notes: deliveryNotes,
        items,
      });
      await loadInvoice();
      setShowDeliveryForm(false);
      setDeliveryBatches(null);
      setDeliveryAllocations({});
      setDeliveryNotes('');
      alert('تم تسليم البضاعة بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل تسليم البضاعة');
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
    {
      key: 'giftQty',
      label: 'الكمية المجانية',
      render: (value: any, row: any) => {
        const parts: string[] = [];
        // Old gift system: same item as gift
        if (row.giftQty && parseFloat(row.giftQty) > 0) {
          parts.push(`${row.giftQty} (نفس الصنف)`);
        }
        // New gift system: separate gift item
        if (row.giftItem && row.giftQuantity && parseFloat(row.giftQuantity) > 0) {
          parts.push(`${row.giftQuantity} × ${row.giftItem.name}`);
        }
        return parts.length > 0 ? parts.join(' / ') : '-';
      },
    },
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
    {
      key: 'receiptNumber',
      label: 'رقم الإيصال',
      render: (value: string, row: any) => {
        if (row.method === 'CASH') return '-';
        return value || 'غير متوفر';
      },
    },
    {
      key: 'receiptUrl',
      label: 'إيصال الدفع',
      render: (value: string, row: any) => {
        if (row.method === 'CASH') return '-';
        if (!value) return 'غير متوفر';
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            عرض الإيصال
          </a>
        );
      },
    },
    { key: 'notes', label: 'ملاحظات' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/dashboard/sales')}>
            ← رجوع
          </Button>
          {user?.role === 'ACCOUNTANT' && (
            <Button
              onClick={() => generateInvoicePDFForAccountant(invoice)}
              className="bg-green-600 hover:bg-green-700"
            >
              🖨️ طباعة للمحاسب (نسختان)
            </Button>
          )}
          <Button
            onClick={() => generateInvoicePDF(invoice)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            📄 تصدير PDF
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
              <p className="font-semibold">{invoice.customer?.name || 'بدون عميل'}</p>
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
              {invoice.paymentConfirmationStatus === 'CONFIRMED' ? (
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
              ) : invoice.paymentConfirmationStatus === 'REJECTED' ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block px-3 py-1 rounded bg-red-100 text-red-800 text-sm font-semibold">
                    ✗ مرفوضة
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
        {!isAuditor && user?.role === 'ACCOUNTANT' && invoice.paymentConfirmationStatus === 'PENDING' && (
          <>
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

            {invoice.paymentConfirmationStatus !== 'REJECTED' && (
              <Card>
                <h3 className="text-xl font-semibold mb-4">رفض الفاتورة</h3>
                <p className="text-gray-600 mb-4">
                  يمكنك رفض الفاتورة قبل تأكيد الدفع
                </p>
                {!showRejectForm ? (
                  <Button 
                    onClick={() => setShowRejectForm(true)}
                    variant="danger"
                    disabled={rejectingInvoice}
                  >
                    رفض الفاتورة
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Input
                      label="ملاحظات الرفض (اختياري)"
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      placeholder="أدخل سبب الرفض..."
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleRejectInvoice}
                        variant="danger"
                        disabled={rejectingInvoice}
                      >
                        {rejectingInvoice ? 'جاري الرفض...' : '✓ تأكيد الرفض'}
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectNotes('');
                        }}
                        variant="secondary"
                        disabled={rejectingInvoice}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        {!isAuditor && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">الإجراءات</h3>
            <div className="flex gap-4">
              {user?.role === 'ACCOUNTANT' &&
                invoice.paymentStatus !== 'PAID' &&
                invoice.paymentConfirmationStatus !== 'REJECTED' &&
                remainingAmount > 0 && (
                  <Button 
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    disabled={submittingPayment}
                  >
                    {showPaymentForm ? 'إلغاء' : 'تسجيل دفعة'}
                  </Button>
                )}

              {user?.role === 'INVENTORY' && invoice.deliveryStatus !== 'DELIVERED' && (
                <>
                  {invoice.paymentConfirmationStatus !== 'CONFIRMED' ? (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-800 font-semibold">⏳ في انتظار تأكيد الدفع</p>
                      <p className="text-orange-700 text-sm mt-1">
                        لا يمكن تسليم البضاعة قبل تأكيد المحاسب للدفع
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {!showDeliveryForm ? (
                        <>
                          <Button
                            onClick={loadDeliveryBatches}
                            disabled={loadingBatches}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {loadingBatches ? 'جاري التحميل...' : 'تسليم جزئي (اختيار الدفعات)'}
                          </Button>
                          <Button
                            onClick={handleDeliver}
                            disabled={delivering}
                            variant="secondary"
                          >
                            {delivering ? 'جاري التسليم...' : 'تسليم كامل (FIFO تلقائي)'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => {
                            setShowDeliveryForm(false);
                            setDeliveryBatches(null);
                            setDeliveryAllocations({});
                            setDeliveryNotes('');
                          }}
                          variant="secondary"
                        >
                          إلغاء
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
             </div>

             {!isAuditor && showPaymentForm && (
            <form onSubmit={handlePayment} className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-3">تسجيل دفعة جديدة</h4>
              
              {duplicateError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-semibold mb-2">{duplicateError.error}</p>
                  {duplicateError.existingTransaction && (
                    <div className="text-sm text-red-700">
                      <p className="font-semibold mb-1">تفاصيل المعاملة السابقة:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {duplicateError.existingTransaction.invoiceNumber && (
                          <li>رقم الفاتورة: {duplicateError.existingTransaction.invoiceNumber}</li>
                        )}
                        {duplicateError.existingTransaction.customer && (
                          <li>العميل: {duplicateError.existingTransaction.customer}</li>
                        )}
                        <li>المبلغ: {formatCurrency(parseFloat(duplicateError.existingTransaction.amount))}</li>
                        <li>رقم الإيصال: {duplicateError.existingTransaction.receiptNumber}</li>
                        {duplicateError.existingTransaction.paidAt && (
                          <li>التاريخ: {formatDateTime(duplicateError.existingTransaction.paidAt)}</li>
                        )}
                        {duplicateError.existingTransaction.createdAt && (
                          <li>التاريخ: {formatDateTime(duplicateError.existingTransaction.createdAt)}</li>
                        )}
                        {duplicateError.existingTransaction.recordedBy && (
                          <li>بواسطة: {duplicateError.existingTransaction.recordedBy}</li>
                        )}
                        {duplicateError.existingTransaction.createdBy && (
                          <li>بواسطة: {duplicateError.existingTransaction.createdBy}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDuplicateError(null)}
                    className="mt-2"
                  >
                    إغلاق
                  </Button>
                </div>
              )}

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
                  <option value="CASH">كاش</option>
                  <option value="BANK">بنكك</option>
                  <option value="BANK_NILE">بنك النيل</option>
                </select>
              </div>
              {paymentData.method !== 'CASH' && (
                <>
                  <Input
                    label="رقم الإيصال (مطلوب)"
                    value={paymentData.receiptNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, receiptNumber: e.target.value })}
                    placeholder="أدخل رقم الإيصال"
                    required
                  />
                  <div className="mb-4">
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
                    {receiptImage && (
                      <div className="mt-2">
                        <img 
                          src={paymentData.receiptUrl} 
                          alt="Receipt preview" 
                          className="max-w-xs max-h-48 object-contain border rounded"
                        />
                      </div>
                    )}
                  </div>
                  <Input
                    label="رابط إيصال الدفع (اختياري إذا تم رفع صورة)"
                    value={paymentData.receiptUrl}
                    onChange={(e) => setPaymentData({ ...paymentData, receiptUrl: e.target.value })}
                    placeholder="أدخل رابط إيصال الدفع"
                  />
                </>
              )}
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
                    setPaymentData({ amount: '', method: 'CASH', notes: '', receiptUrl: '', receiptNumber: '' });
                    setReceiptImage(null);
                    setDuplicateError(null);
                  }}
                  disabled={submittingPayment}
                >
                  إلغاء
                </Button>
               </div>
             </form>
             )}

           </Card>
         )}

        {/* Partial Delivery Form */}
        {!isAuditor && user?.role === 'INVENTORY' && showDeliveryForm && deliveryBatches && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">تسليم جزئي - اختيار الدفعات حسب تاريخ الصلاحية</h3>
            
            <div className="space-y-6">
              {deliveryBatches.items.map((item: any) => {
                const allocations = Object.values(deliveryAllocations[item.itemId] || {}) as Record<string, number>[];
                const quantities = allocations.flatMap((expiryAllocs) => Object.values(expiryAllocs) as number[]);
                const totalAllocated = quantities.reduce((sum: number, qty: number) => sum + (qty || 0), 0);
                
                return (
                  <div key={item.itemId} className="border rounded-lg p-4 bg-gray-50">
                    <div className="mb-4 pb-3 border-b">
                      <h4 className="text-lg font-semibold">{item.itemName}</h4>
                      <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-gray-600">المطلوب:</span>
                          <span className="font-semibold mr-2">{parseFloat(item.totalOrdered)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">المسلم:</span>
                          <span className="font-semibold mr-2 text-green-600">{parseFloat(item.delivered)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">المتبقي:</span>
                          <span className="font-semibold mr-2 text-red-600">{parseFloat(item.remaining)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">المحدد للتسليم:</span>
                          <span className={`font-semibold mr-2 ${totalAllocated > parseFloat(item.remaining) ? 'text-red-600' : 'text-blue-600'}`}>
                            {totalAllocated}
                          </span>
                        </div>
                      </div>
                    </div>

                    {item.expiryGroups.length === 0 ? (
                      <p className="text-red-600 font-semibold">⚠️ لا توجد دفعات متوفرة لهذا الصنف</p>
                    ) : (
                      <div className="space-y-4">
                        {item.expiryGroups.map((expiryGroup: any, groupIdx: number) => {
                          const expiryKey = expiryGroup.expiryDate || 'no-expiry';
                          const groupAllocations = deliveryAllocations[item.itemId]?.[expiryKey] || {};
                          const groupTotal = (Object.values(groupAllocations) as number[]).reduce((sum: number, qty: number) => sum + qty, 0);
                          
                          return (
                            <div key={groupIdx} className="border rounded p-3 bg-white">
                              <div className="flex justify-between items-center mb-3">
                                <h5 className="font-semibold">
                                  {expiryGroup.expiryDate 
                                    ? `تاريخ الصلاحية: ${new Date(expiryGroup.expiryDate).toLocaleDateString('ar-SD')}`
                                    : 'بدون تاريخ صلاحية'}
                                </h5>
                                <div className="text-sm">
                                  <span className="text-gray-600">المتاح:</span>
                                  <span className="font-semibold mr-2">{parseFloat(expiryGroup.totalQuantity)}</span>
                                  <span className="text-gray-600 mr-4">المحدد:</span>
                                  <span className={`font-semibold ${groupTotal > parseFloat(expiryGroup.totalQuantity) ? 'text-red-600' : 'text-blue-600'}`}>
                                    {groupTotal}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {expiryGroup.batches.map((batch: any) => {
                                  const allocated = groupAllocations[batch.id] || 0;
                                  const available = parseFloat(batch.quantity);
                                  
                                  return (
                                    <div key={batch.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                                      <div className="flex-1">
                                        <div className="text-sm text-gray-600">
                                          الكمية المتوفرة: <span className="font-semibold">{available}</span>
                                          {batch.notes && <span className="mr-2">({batch.notes})</span>}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          تاريخ الاستلام: {new Date(batch.receivedAt).toLocaleDateString('ar-SD')}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium">الكمية:</label>
                                        <input
                                          type="number"
                                          min="0"
                                          max={available}
                                          step="0.01"
                                          value={allocated}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            handleAllocationChange(item.itemId, expiryGroup.expiryDate, batch.id, value);
                                          }}
                                          className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleAllocationChange(item.itemId, expiryGroup.expiryDate, batch.id, available)}
                                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                          الكل
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t">
              <Input
                label="ملاحظات (اختياري)"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handlePartialDelivery}
                  disabled={delivering}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {delivering ? 'جاري التسليم...' : 'تأكيد التسليم'}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeliveryForm(false);
                    setDeliveryBatches(null);
                    setDeliveryAllocations({});
                    setDeliveryNotes('');
                  }}
                  variant="secondary"
                  disabled={delivering}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </Card>
        )}

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

