'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Input from '@/components/Input';
import { formatCurrency } from '@/lib/utils';

export default function NewProcOrderPage() {
  const router = useRouter();
  const [inventories, setInventories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    inventoryId: '',
    section: 'GROCERY',
    supplierId: '',
    notes: '',
  });

  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState({
    itemId: '',
    quantity: 1,
    unitCost: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.section) {
      loadItems(formData.section);
    }
  }, [formData.section]);

  const loadData = async () => {
    try {
      const [inventoriesData, suppliersData] = await Promise.all([
        api.getInventories(),
        api.getSuppliers(),
      ]);
      
      setInventories(inventoriesData);
      setSuppliers(suppliersData);
      
      if (inventoriesData.length > 0) {
        setFormData((prev) => ({ ...prev, inventoryId: inventoriesData[0].id }));
      }
      if (suppliersData.length > 0) {
        setFormData((prev) => ({ ...prev, supplierId: suppliersData[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (section: string) => {
    try {
      const data = await api.getItems(section);
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const addItem = () => {
    if (!currentItem.itemId || currentItem.quantity <= 0 || !currentItem.unitCost) {
      alert('يرجى اختيار الصنف والكمية والسعر');
      return;
    }

    const item = items.find((i) => i.id === currentItem.itemId);
    if (!item) return;

    const existingIndex = orderItems.findIndex((i) => i.itemId === currentItem.itemId);
    
    if (existingIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingIndex] = {
        ...currentItem,
        item,
        unitCost: parseFloat(currentItem.unitCost),
      };
      setOrderItems(updatedItems);
    } else {
      setOrderItems([
        ...orderItems,
        {
          ...currentItem,
          item,
          unitCost: parseFloat(currentItem.unitCost),
        },
      ]);
    }
    
    setCurrentItem({ itemId: '', quantity: 1, unitCost: '' });
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitCost;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل');
      return;
    }

    if (!formData.inventoryId || !formData.supplierId) {
      alert('يرجى اختيار المخزن والمورد');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        inventoryId: formData.inventoryId,
        section: formData.section,
        supplierId: formData.supplierId,
        items: orderItems.map((item) => ({
          itemId: item.itemId,
          quantity: parseFloat(item.quantity),
          unitCost: parseFloat(item.unitCost),
        })),
        notes: formData.notes,
      };

      await api.createProcOrder(orderData);
      alert('تم إنشاء أمر الشراء بنجاح!');
      router.push('/dashboard/procurement');
    } catch (error: any) {
      alert(error.message || 'فشل إنشاء أمر الشراء');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  const total = calculateTotal();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">إنشاء أمر شراء جديد</h1>
        <Button variant="secondary" onClick={() => router.push('/dashboard/procurement')}>
          إلغاء
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-xl font-semibold mb-4">معلومات الأمر</h2>
              
              <Select
                label="المخزن"
                value={formData.inventoryId}
                onChange={(e) => setFormData({ ...formData, inventoryId: e.target.value })}
                options={inventories.map((inv) => ({ value: inv.id, label: inv.name }))}
                required
              />

              <Select
                label="القسم"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                options={[
                  { value: 'GROCERY', label: 'بقالة' },
                  { value: 'BAKERY', label: 'أفران' },
                ]}
                required
              />

              <Select
                label="المورد"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                options={suppliers.map((sup) => ({ value: sup.id, label: sup.name }))}
                required
              />

              <Input
                label="ملاحظات (اختياري)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية"
              />
            </Card>

            {/* Add Items */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">إضافة الأصناف</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5">
                  <Select
                    label="الصنف"
                    value={currentItem.itemId}
                    onChange={(e) => setCurrentItem({ ...currentItem, itemId: e.target.value })}
                    options={[
                      { value: '', label: 'اختر صنفاً' },
                      ...items.map((item) => ({ value: item.id, label: item.name })),
                    ]}
                  />
                </div>

                <div className="md:col-span-3">
                  <Input
                    label="الكمية"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="md:col-span-3">
                  <Input
                    label="سعر الوحدة"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentItem.unitCost}
                    onChange={(e) => setCurrentItem({ ...currentItem, unitCost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-1">
                  <Button type="button" onClick={addItem} size="sm">
                    +
                  </Button>
                </div>
              </div>

              {/* Items List */}
              {orderItems.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">الأصناف المضافة</h3>
                  <div className="space-y-2">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.item.name}</p>
                          <p className="text-sm text-gray-600">
                            الكمية: {item.quantity} × {formatCurrency(item.unitCost)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-lg">
                            {formatCurrency(item.quantity * item.unitCost)}
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <h2 className="text-xl font-semibold mb-4">ملخص الأمر</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">عدد الأصناف:</span>
                  <span className="font-semibold">{orderItems.length}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">الكمية الإجمالية:</span>
                  <span className="font-semibold">
                    {orderItems.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}
                  </span>
                </div>

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">المجموع:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={orderItems.length === 0 || submitting}
                >
                  {submitting ? 'جاري الإنشاء...' : 'إنشاء الأمر'}
                </Button>
              </div>

              {orderItems.length === 0 && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  أضف صنفاً واحداً على الأقل
                </p>
              )}
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

