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
  const [showForm, setShowForm] = useState(false);
  
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
    try {
      const data = await api.getInventoryStocks(form.fromInventoryId, { section: selectedSection });
      setSourceStocks(data);
    } catch (error) {
      console.error('Error loading source stocks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data before submission
    if (!form.fromInventoryId || !form.toInventoryId || !form.itemId) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    const quantity = parseFloat(form.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('يرجى إدخال كمية صالحة أكبر من صفر');
      return;
    }
    
    if (quantity > availableQtyNum) {
      alert(`الكمية المطلوبة (${formatNumber(quantity)}) تتجاوز الكمية المتاحة (${formatNumber(availableQtyNum)})`);
      return;
    }
    
    try {
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
    }
  };

  const handleItemChange = (itemId: string) => {
    setForm((prev) => ({ ...prev, itemId }));
    const stock = sourceStocks.find((s) => s.itemId === itemId);
    if (stock) {
      // Auto-fill max available quantity as a suggestion
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
                onChange={(e) => setForm((prev) => ({ ...prev, fromInventoryId: e.target.value, itemId: '' }))}
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
                options={sourceStocks
                  .filter((s) => parseFloat(s.quantity) > 0)
                  .map((stock) => ({
                    value: stock.itemId,
                    label: `${stock.item.name} (متاح: ${formatNumber(stock.quantity)})`,
                  }))}
                required
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
                disabled={!hasStock}
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
              <Button type="submit" disabled={!hasStock}>نقل الأصناف</Button>
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
        <h2 className="text-xl font-semibold mb-4">سجل النقل</h2>
        <Table columns={columns} data={transfers} />
      </Card>
    </div>
  );
}
