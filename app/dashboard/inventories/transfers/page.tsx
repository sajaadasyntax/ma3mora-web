'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { formatNumber, formatDateTime, sectionLabels } from '@/lib/utils';

export default function InventoryTransfersPage() {
  const { user } = useUser();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [sourceStocks, setSourceStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    fromInventoryId: '',
    toInventoryId: '',
    itemId: '',
    quantity: '',
    notes: '',
  });
  
  const [selectedSection, setSelectedSection] = useState('GROCERY');
  const [filters, setFilters] = useState({
    inventoryId: '',
    itemId: '',
  });

  const canEdit = user?.role === 'MANAGER' || user?.role === 'INVENTORY' || user?.role === 'SALES_GROCERY' || user?.role === 'SALES_BAKERY';

  const loadData = async () => {
    try {
      const [inventoriesData, itemsData] = await Promise.all([
        api.getInventories(),
        api.getItems(selectedSection),
      ]);
      setInventories(inventoriesData);
      setItems(itemsData);
      if (inventoriesData.length > 0 && !form.fromInventoryId) {
        setForm((prev) => ({ ...prev, fromInventoryId: inventoriesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = useCallback(async () => {
    try {
      const params: any = {};
      if (filters.inventoryId) params.inventoryId = filters.inventoryId;
      if (filters.itemId) params.itemId = filters.itemId;
      const data = await api.getInventoryTransfers(params);
      setTransfers(data);
    } catch (error: any) {
      console.error('Error loading transfers:', error);
      alert(error.message || 'فشل تحميل بيانات النقل');
    }
  }, [filters.inventoryId, filters.itemId]);

  useEffect(() => {
    const initialize = async () => {
      await loadData();
    };
    initialize();
  }, []);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  useEffect(() => {
    if (form.fromInventoryId && selectedSection) {
      loadSourceStocks();
    }
  }, [form.fromInventoryId, selectedSection]);

  const loadSourceStocks = async () => {
    if (!form.fromInventoryId || !selectedSection) return;
    
    try {
      setLoadingStocks(true);
      const data = await api.getInventoryStocks(form.fromInventoryId, { section: selectedSection });
      setSourceStocks(data);
    } catch (error) {
      console.error('Error loading source stocks:', error);
      setSourceStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    // Validate form data before submission with better error messages
    if (!form.fromInventoryId) {
      alert('يرجى اختيار المخزن المصدر');
      return;
    }
    
    if (!form.toInventoryId) {
      alert('يرجى اختيار المخزن الهدف');
      return;
    }
    
    if (form.fromInventoryId === form.toInventoryId) {
      alert('لا يمكن نقل الأصناف من مخزن إلى نفسه');
      return;
    }
    
    if (!form.itemId) {
      alert('يرجى اختيار الصنف');
      return;
    }
    
    if (sourceStocks.length === 0) {
      alert('جارٍ تحميل بيانات المخزون، يرجى الانتظار قليلاً');
      return;
    }
    
    const sourceHasItem = sourceStocks.some((s) => s.itemId === form.itemId);
    if (!sourceHasItem) {
      alert('الصنف المحدد غير متاح في المخزن المصدر');
      return;
    }
    
    const quantity = parseFloat((form.quantity || '').toString().replace(',', '.').trim());
    if (isNaN(quantity) || quantity <= 0) {
      alert('يرجى إدخال كمية صالحة أكبر من صفر');
      return;
    }
    
    if (quantity > availableQtyNum) {
      alert(`الكمية المطلوبة (${formatNumber(quantity)}) تتجاوز الكمية المتاحة (${formatNumber(availableQtyNum)})`);
      return;
    }
    
    try {
      setSubmitting(true);
      await api.createInventoryTransfer({
        fromInventoryId: form.fromInventoryId,
        toInventoryId: form.toInventoryId,
        itemId: form.itemId,
        quantity: quantity,
        notes: form.notes || undefined,
      });
      alert('تم نقل الأصناف بنجاح');
      setForm({
        fromInventoryId: inventories[0]?.id || '',
        toInventoryId: '',
        itemId: '',
        quantity: '',
        notes: '',
      });
      setShowForm(false);
      loadTransfers();
      loadSourceStocks();
    } catch (error: any) {
      const errorMessage = error?.error || error?.message || 'فشل نقل الأصناف';
      alert(errorMessage);
      console.error('Transfer error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemChange = (itemId: string) => {
    setForm((prev) => ({ ...prev, itemId }));
    const stock = sourceStocks.find((s) => s.itemId === itemId);
    if (stock) {
      // Auto-fill max available quantity as a suggestion
      const currentQty = parseFloat((form.quantity || '').toString().replace(',', '.'));
      const maxQty = typeof stock.quantity === 'string' ? parseFloat(stock.quantity) || 0 : stock.quantity || 0;
      if (!isNaN(currentQty) && currentQty > maxQty) {
        setForm((prev) => ({ ...prev, quantity: maxQty.toString() }));
      }
    }
  };

  const columns = [
    {
      key: 'transferredAt',
      label: 'التاريخ',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'fromInventory',
      label: 'من مخزن',
      render: (value: any) => value.name,
    },
    {
      key: 'toInventory',
      label: 'إلى مخزن',
      render: (value: any) => value.name,
    },
    {
      key: 'item',
      label: 'الصنف',
      render: (value: any) => value.name,
    },
    {
      key: 'quantity',
      label: 'الكمية',
      render: (value: any) => formatNumber(value),
    },
    {
      key: 'transferredByUser',
      label: 'نقل بواسطة',
      render: (value: any) => value.username,
    },
    {
      key: 'notes',
      label: 'ملاحظات',
    },
  ];

  const printReport = () => {
    const printSection = document.getElementById('transfer-print-section');
    if (!printSection) return;

    const printContent = printSection.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>تقرير نقل الأصناف</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { margin-bottom: 20px; }
            .header h1 { margin: 0 0 10px 0; }
            .header p { margin: 5px 0; color: #666; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير نقل الأصناف بين المخازن</h1>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            ${filters.inventoryId ? `<p>المخزن: ${inventories.find(inv => inv.id === filters.inventoryId)?.name || 'الكل'}</p>` : ''}
            ${filters.itemId ? `<p>الصنف: ${items.find(item => item.id === filters.itemId)?.name || 'الكل'}</p>` : ''}
            <p>إجمالي عدد النقل: ${transfers.length}</p>
          </div>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  const availableQuantity = form.itemId
    ? sourceStocks.find((s) => s.itemId === form.itemId)?.quantity || 0
    : 0;
  const availableQtyNum = typeof availableQuantity === 'string' ? parseFloat(availableQuantity) || 0 : availableQuantity;
  const hasStock = !!form.itemId && availableQtyNum > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">نقل الأصناف بين المخازن</h1>
        {canEdit && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'إلغاء' : 'نقل أصناف جديدة'}
          </Button>
        )}
      </div>

      {showForm && canEdit && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">نقل أصناف جديدة</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="القسم"
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  api.getItems(e.target.value).then(setItems);
                  setForm((prev) => ({ ...prev, itemId: '' }));
                }}
                options={[
                  { value: 'GROCERY', label: 'بقالة' },
                  { value: 'BAKERY', label: 'أفران' },
                ]}
              />
              
              <Select
                label="من مخزن"
                value={form.fromInventoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, fromInventoryId: e.target.value, itemId: '', quantity: '' }))}
                options={inventories.map((inv) => ({ value: inv.id, label: inv.name }))}
                required
              />

              <Select
                label="إلى مخزن"
                value={form.toInventoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, toInventoryId: e.target.value }))}
                options={inventories
                  .filter((inv) => inv.id !== form.fromInventoryId)
                  .map((inv) => ({ value: inv.id, label: inv.name }))}
                required
              />

              <Select
                label="الصنف"
                value={form.itemId}
                onChange={(e) => handleItemChange(e.target.value)}
                options={[
                  { value: '', label: loadingStocks ? 'جارٍ التحميل...' : sourceStocks.length === 0 ? 'لا توجد أصناف متاحة' : 'اختر الصنف' },
                  ...sourceStocks
                    .filter((s) => parseFloat(s.quantity.toString()) > 0)
                    .map((stock) => ({
                      value: stock.itemId,
                      label: `${stock.item.name} (متاح: ${formatNumber(stock.quantity)})`,
                    })),
                ]}
                required
                disabled={sourceStocks.length === 0 || loadingStocks || !form.fromInventoryId}
              />

              <Input
                label="الكمية"
                type="number"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                required
                max={hasStock ? availableQtyNum.toString() : undefined}
                min={hasStock ? '0.01' : undefined}
                disabled={!hasStock || submitting}
              />

              <div className="col-span-2">
                {form.itemId && (
                  <p className="text-sm text-gray-600 mb-2">
                    الكمية المتاحة: <span className="font-semibold">{formatNumber(availableQtyNum)}</span>
                  </p>
                )}
                {form.itemId && !hasStock && (
                  <p className="text-sm text-red-600">لا توجد كمية متاحة لهذا الصنف في المخزن المحدد.</p>
                )}
              </div>

              <div className="col-span-2">
                <Input
                  label="ملاحظات (اختياري)"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!hasStock || submitting}>نقل الأصناف</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">مرشحات البحث</h2>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="المخزن"
            value={filters.inventoryId}
            onChange={(e) => setFilters((prev) => ({ ...prev, inventoryId: e.target.value }))}
            options={[{ value: '', label: 'الكل' }, ...inventories.map((inv) => ({ value: inv.id, label: inv.name }))]}
          />

          <Select
            label="الصنف"
            value={filters.itemId}
            onChange={(e) => setFilters((prev) => ({ ...prev, itemId: e.target.value }))}
            options={[{ value: '', label: 'الكل' }, ...items.map((item) => ({ value: item.id, label: item.name }))]}
          />
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">سجل النقل</h2>
          {transfers.length > 0 && (
            <Button variant="secondary" onClick={printReport}>
              🖨️ طباعة التقرير
            </Button>
          )}
        </div>
        <div id="transfer-print-section">
          <Table columns={columns} data={transfers} />
        </div>
      </Card>
    </div>
  );
}
