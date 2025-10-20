'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Input from '@/components/Input';
import { formatCurrency } from '@/lib/utils';

export default function NewSalesInvoicePage() {
  const { user } = useUser();
  const router = useRouter();
  const [inventories, setInventories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Determine section based on user role
  const getUserSection = () => {
    if (user?.role === 'SALES_GROCERY') return 'GROCERY';
    if (user?.role === 'SALES_BAKERY') return 'BAKERY';
    return 'GROCERY'; // Default
  };

  const [formData, setFormData] = useState({
    inventoryId: '',
    section: getUserSection(),
    customerId: '',
    paymentMethod: 'CASH',
    discount: 0,
    notes: '',
  });

  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState({
    itemId: '',
    quantity: 1,
    giftQty: 0,
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, section: getUserSection() }));
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (formData.section) {
      loadItems(formData.section);
      loadCustomers(formData.section);
    }
  }, [formData.section]);

  const loadData = async () => {
    try {
      const inventoriesData = await api.getInventories();
      setInventories(inventoriesData);
      if (inventoriesData.length > 0) {
        setFormData((prev) => ({ ...prev, inventoryId: inventoriesData[0].id }));
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

  const loadCustomers = async (section: string) => {
    try {
      const data = await api.getCustomers({ division: section });
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const addItem = () => {
    if (!currentItem.itemId || currentItem.quantity <= 0) {
      alert('يرجى اختيار الصنف والكمية');
      return;
    }

    const item = items.find((i) => i.id === currentItem.itemId);
    if (!item) return;

    setInvoiceItems([...invoiceItems, { ...currentItem, item }]);
    setCurrentItem({ itemId: '', quantity: 1, giftQty: 0 });
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const customer = customers.find((c) => c.id === formData.customerId);
    if (!customer) return 0;

    const subtotal = invoiceItems.reduce((sum, lineItem) => {
      const prices = lineItem.item.prices.filter((p: any) => p.tier === customer.type);
      if (prices.length === 0) return sum;
      const price = parseFloat(prices[0].price);
      return sum + price * lineItem.quantity;
    }, 0);

    return subtotal - formData.discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (invoiceItems.length === 0) {
      alert('يرجى إضافة أصناف للفاتورة');
      return;
    }

    setSubmitting(true);
    try {
      await api.createSalesInvoice({
        ...formData,
        items: invoiceItems.map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          giftQty: i.giftQty,
        })),
      });
      alert('تم إنشاء الفاتورة بنجاح');
      router.push('/dashboard/sales');
    } catch (error: any) {
      alert(error.message || 'فشل إنشاء الفاتورة');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">فاتورة مبيعات جديدة</h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="المخزن"
              value={formData.inventoryId}
              onChange={(e) => setFormData({ ...formData, inventoryId: e.target.value })}
              options={inventories.map((inv) => ({ value: inv.id, label: inv.name }))}
              required
            />

            {/* Hide section selector for sales users - they can only access their assigned section */}
            {user?.role !== 'SALES_GROCERY' && user?.role !== 'SALES_BAKERY' ? (
              <Select
                label="القسم"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                options={[
                  { value: 'GROCERY', label: 'بقالة' },
                  { value: 'BAKERY', label: 'أفران' },
                ]}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                  {formData.section === 'GROCERY' ? 'بقالة' : 'أفران'}
                </div>
              </div>
            )}

            <Select
              label="العميل"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              options={[
                { value: '', label: 'اختر العميل' },
                ...customers.map((c) => ({ value: c.id, label: c.name })),
              ]}
              required
            />

            <Select
              label="طريقة الدفع"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={[
                { value: 'CASH', label: 'كاش' },
                { value: 'BANK', label: 'بنك' },
              ]}
            />
          </div>

          <Input
            label="الخصم"
            type="number"
            step="0.01"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
          />

          <Input
            label="ملاحظات"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <hr className="my-6" />

          <h3 className="text-lg font-semibold mb-4">الأصناف</h3>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <Select
              label="الصنف"
              value={currentItem.itemId}
              onChange={(e) => setCurrentItem({ ...currentItem, itemId: e.target.value })}
              options={[
                { value: '', label: 'اختر الصنف' },
                ...items.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />

            <Input
              label="الكمية"
              type="number"
              step="0.01"
              value={currentItem.quantity}
              onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseFloat(e.target.value) || 0 })}
            />

            <Input
              label="الهدية"
              type="number"
              step="0.01"
              value={currentItem.giftQty}
              onChange={(e) => setCurrentItem({ ...currentItem, giftQty: parseFloat(e.target.value) || 0 })}
            />

            <div className="flex items-end">
              <Button type="button" onClick={addItem} className="w-full">
                إضافة
              </Button>
            </div>
          </div>

          {invoiceItems.length > 0 && (
            <div className="mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الصنف</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الكمية</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الهدية</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm">{item.item.name}</td>
                      <td className="px-4 py-2 text-sm">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm">{item.giftQty}</td>
                      <td className="px-4 py-2 text-sm">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          حذف
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 text-left text-lg font-semibold">
                المجموع: {formatCurrency(calculateTotal())}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={submitting}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

