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
import { generateInvoicePDF } from '@/lib/pdfUtils';
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
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [showPartialForm, setShowPartialForm] = useState(false);
  const [isFullByBatches, setIsFullByBatches] = useState(false);
  const [allocations, setAllocations] = useState<Record<string, { giftQty: string; batches: Array<{ batchId: string; quantity: string }> }>>({});
  const [batchMeta, setBatchMeta] = useState<Record<string, any[]>>({});
  const [showPaymentForm, setShowPaymentForm] = useState(false);
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

  const loadBatchesForItem = async (itemId: string) => {
    const batches = await api.getStockBatches(invoice.inventoryId, itemId);
    setAllocations(prev => ({
      ...prev,
      [itemId]: prev[itemId] || { giftQty: '', batches: batches.map((b: any) => ({ batchId: b.id, quantity: '' })) },
    }));
    setBatchMeta(prev => ({ ...prev, [itemId]: batches }));
  };

  const loadAllBatchesForFullDelivery = async () => {
    if (!invoice) return;
    // Load batches for all items and prefill quantities to ordered qty (qty + giftQty)
    const entries = await Promise.all(
      invoice.items.map(async (invItem: any) => {
        const batches = await api.getStockBatches(invoice.inventoryId, invItem.itemId);
        // Prefill using FIFO order as returned by API; limit by ordered qty
        const ordered = parseFloat(invItem.quantity) + parseFloat(invItem.giftQty || 0);
        let remaining = isNaN(ordered) ? 0 : ordered;
        const prefilled = batches.map((b: any) => {
          if (remaining <= 0) return { batchId: b.id, quantity: '' };
          const avail = parseFloat(b.quantity);
          const take = Math.min(avail, remaining);
          remaining -= take;
          return { batchId: b.id, quantity: take > 0 ? String(take) : '' };
        });
        setBatchMeta(prev => ({ ...prev, [invItem.itemId]: batches }));
        return [invItem.itemId, { giftQty: '', batches: prefilled }] as const;
      })
    );
    setAllocations(Object.fromEntries(entries));
    setIsFullByBatches(true);
    setShowPartialForm(true);
  };

  const handlePartialDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    setDelivering(true);
    try {
      const itemsPayload = Object.entries(allocations)
        .map(([itemId, v]) => ({
          itemId,
          giftQty: v.giftQty ? parseFloat(v.giftQty) : 0,
          allocations: v.batches
            .filter((b) => b.quantity && parseFloat(b.quantity) > 0)
            .map((b) => ({ batchId: b.batchId, quantity: parseFloat(b.quantity) })),
        }))
        .filter((i) => i.allocations.length > 0 || (i.giftQty && i.giftQty > 0));

      if (itemsPayload.length === 0) {
        alert('الرجاء إدخال كميات للتسليم');
        setDelivering(false);
        return;
      }

      await api.partialDeliverInvoice(params.id, { items: itemsPayload });
      await loadInvoice();
      setShowPartialForm(false);
      setAllocations({});
      alert('تم تسجيل التسليم الجزئي بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل التسليم الجزئي');
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
        {!isAuditor && user?.role === 'ACCOUNTANT' && !invoice.paymentConfirmed && (
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

        {!isAuditor && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">الإجراءات</h3>
            <div className="flex gap-4">
              {user?.role === 'ACCOUNTANT' &&
                invoice.paymentStatus !== 'PAID' &&
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
                  {!invoice.paymentConfirmed ? (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-800 font-semibold">⏳ في انتظار تأكيد الدفع</p>
                      <p className="text-orange-700 text-sm mt-1">
                        لا يمكن تسليم البضاعة قبل تأكيد المحاسب للدفع
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setIsFullByBatches(false);
                          setShowPartialForm(!showPartialForm);
                        }}
                        disabled={delivering}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {showPartialForm && !isFullByBatches ? 'إلغاء' : 'تسليم جزئي حسب الدُفعات'}
                      </Button>
                      {invoice.deliveryStatus === 'NOT_DELIVERED' && (
                        <Button
                          onClick={loadAllBatchesForFullDelivery}
                          disabled={delivering}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {isFullByBatches ? 'إعادة التحميل' : 'تسليم كامل باختيار الدُفعات'}
                        </Button>
                      )}
                      <Button
                        onClick={handleDeliver}
                        disabled={delivering}
                      >
                        {delivering ? 'جاري التسليم...' : 'تسليم كامل (تلقائي FIFO)'}
                      </Button>
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

             {/* Partial Delivery Form */}
            {user?.role === 'INVENTORY' && invoice.paymentConfirmed && showPartialForm && (
               <form onSubmit={handlePartialDeliver} className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-4">
                  {isFullByBatches ? 'تسليم كامل باختيار الدُفعات' : 'تخصيص الكميات حسب الدُفعات'}
                </h4>
                 <div className="space-y-6">
                   {invoice.items.map((invItem: any) => (
                     <div key={invItem.id} className="p-3 bg-white rounded border">
                       <div className="flex items-center justify-between">
                         <div>
                           <div className="font-semibold">{invItem.item.name}</div>
                          <div className="text-sm text-gray-600">الكمية المطلوبة: {parseFloat(invItem.quantity) + parseFloat(invItem.giftQty)}</div>
                         </div>
                         <Button
                           type="button"
                           variant="secondary"
                          onClick={() => loadBatchesForItem(invItem.itemId)}
                         >
                           تحميل الدُفعات
                         </Button>
                       </div>

                       {allocations[invItem.itemId]?.batches && (
                         <div className="mt-3 space-y-2">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {allocations[invItem.itemId].batches.map((b, idx) => {
                              const batchMeta = (invoice as any)._batchCache?.[invItem.itemId]?.find((x: any) => x.id === b.batchId);
                              return (
                                <div key={b.batchId} className="flex items-center gap-2">
                                  <div className="text-sm text-gray-600">
                                    دفعة #{idx + 1}
                                    {batchMeta && (
                                      <span className="ml-2 text-xs text-gray-500">
                                        متاح: {parseFloat(batchMeta.quantity)}{batchMeta.expiryDate ? ` · انتهاء: ${new Date(batchMeta.expiryDate).toLocaleDateString('ar-EG')}` : ''}
                                      </span>
                                    )}
                                  </div>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="الكمية"
                                    value={b.quantity}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setAllocations(prev => ({
                                        ...prev,
                                        [invItem.itemId]: {
                                          ...prev[invItem.itemId],
                                          batches: prev[invItem.itemId].batches.map((bb) => bb.batchId === b.batchId ? { ...bb, quantity: val } : bb),
                                        },
                                      }));
                                    }}
                                  />
                                </div>
                              );
                            })}
                           </div>
                           <div className="mt-2">
                             <Input
                               label="كمية الهدايا (اختياري)"
                               type="number"
                               step="0.01"
                               value={allocations[invItem.itemId].giftQty}
                               onChange={(e) => setAllocations(prev => ({
                                 ...prev,
                                 [invItem.itemId]: { ...prev[invItem.itemId], giftQty: e.target.value },
                               }))}
                             />
                           </div>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
                <div className="mt-4 flex gap-2">
                  <Button type="submit" disabled={delivering}>{delivering ? 'جاري الحفظ...' : (isFullByBatches ? 'تأكيد التسليم الكامل' : 'حفظ التسليم الجزئي')}</Button>
                  <Button type="button" variant="secondary" onClick={() => { setShowPartialForm(false); setIsFullByBatches(false); }}>إلغاء</Button>
                 </div>
               </form>
             )}
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

