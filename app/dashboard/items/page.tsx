'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { formatCurrency, sectionLabels } from '@/lib/utils';

export default function ItemsPage() {
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPrices, setEditingPrices] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    section: 'GROCERY',
    wholesalePrice: '',
    retailPrice: '',
  });
  const [priceData, setPriceData] = useState({
    wholesalePrice: '',
    retailPrice: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createItem({
        ...formData,
        wholesalePrice: parseFloat(formData.wholesalePrice),
        retailPrice: parseFloat(formData.retailPrice),
      });
      setShowForm(false);
      setFormData({
        name: '',
        section: 'GROCERY',
        wholesalePrice: '',
        retailPrice: '',
      });
      await loadItems();
      alert('تم إضافة الصنف بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل إضافة الصنف');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePrices = async (itemId: string) => {
    setUpdatingPrices(true);
    try {
      await api.updateItemPrices(itemId, {
        wholesalePrice: priceData.wholesalePrice ? parseFloat(priceData.wholesalePrice) : undefined,
        retailPrice: priceData.retailPrice ? parseFloat(priceData.retailPrice) : undefined,
      });
      setEditingPrices(null);
      setPriceData({ wholesalePrice: '', retailPrice: '' });
      await loadItems();
      alert('تم تحديث الأسعار بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل تحديث الأسعار');
    } finally {
      setUpdatingPrices(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الصنف "${itemName}"؟\nيمكن الحذف فقط إذا كانت الكمية في جميع المخازن = 0`)) {
      return;
    }

    setDeletingItem(itemId);
    try {
      await api.deleteItem(itemId);
      alert('تم حذف الصنف بنجاح');
      await loadItems();
    } catch (error: any) {
      alert(error.message || 'فشل حذف الصنف');
    } finally {
      setDeletingItem(null);
    }
  };

  const getTotalStock = (item: any) => {
    // This assumes the item includes stock info - we'll need to fetch this
    // For now, we'll show the delete button for procurement
    return 0;
  };

  const getLatestPrices = (item: any) => {
    const wholesale = item.prices.find((p: any) => p.tier === 'WHOLESALE');
    const retail = item.prices.find((p: any) => p.tier === 'RETAIL');
    return { wholesale, retail };
  };

  const columns = [
    { key: 'name', label: 'اسم الصنف' },
    {
      key: 'section',
      label: 'القسم',
      render: (value: string) => sectionLabels[value],
    },
    {
      key: 'totalStock',
      label: 'الكمية',
      render: (value: any) => {
        const stockValue = parseFloat(value) || 0;
        return (
          <span className={`font-semibold ${
            stockValue === 0 ? 'text-red-600' : stockValue < 50 ? 'text-orange-600' : 'text-green-600'
          }`}>
            {stockValue.toFixed(2)}
          </span>
        );
      },
    },
    {
      key: 'wholesalePrice',
      label: 'سعر الجملة',
      render: (_: any, row: any) => {
        const prices = getLatestPrices(row);
        return prices.wholesale ? formatCurrency(prices.wholesale.price) : '-';
      },
    },
    {
      key: 'retailPrice',
      label: 'سعر القطاعي',
      render: (_: any, row: any) => {
        const prices = getLatestPrices(row);
        return prices.retail ? formatCurrency(prices.retail.price) : '-';
      },
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          {user?.role === 'ACCOUNTANT' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditingPrices(row.id)}
            >
              تعديل الأسعار
            </Button>
          )}
          {user?.role === 'PROCUREMENT' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDeleteItem(row.id, row.name)}
              disabled={parseFloat(row.totalStock || 0) > 0 || deletingItem === row.id}
              title={parseFloat(row.totalStock || 0) > 0 ? 'لا يمكن الحذف - يوجد كمية في المخزون' : 'حذف الصنف'}
            >
              {deletingItem === row.id ? 'جاري الحذف...' : 'حذف'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  const totalItems = items.length;
  const totalStock = items.reduce((sum, item) => sum + (item.totalStock || 0), 0);
  const lowStockItems = items.filter((item) => (item.totalStock || 0) < 50 && (item.totalStock || 0) > 0).length;
  const outOfStockItems = items.filter((item) => (item.totalStock || 0) === 0).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">الأصناف والأسعار</h1>
        {user?.role === 'PROCUREMENT' && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'إلغاء' : 'إضافة صنف جديد'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-sm font-semibold mb-1">إجمالي الأصناف</h3>
          <p className="text-3xl font-bold">{totalItems}</p>
          <p className="text-xs mt-1">صنف مسجل</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-sm font-semibold mb-1">إجمالي المخزون</h3>
          <p className="text-3xl font-bold">{totalStock.toFixed(2)}</p>
          <p className="text-xs mt-1">وحدة في جميع المخازن</p>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <h3 className="text-sm font-semibold mb-1">مخزون منخفض</h3>
          <p className="text-3xl font-bold">{lowStockItems}</p>
          <p className="text-xs mt-1">صنف</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <h3 className="text-sm font-semibold mb-1">نفذ من المخزون</h3>
          <p className="text-3xl font-bold">{outOfStockItems}</p>
          <p className="text-xs mt-1">صنف</p>
        </Card>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit}>
            <Input
              label="اسم الصنف"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            />

            <Input
              label="سعر الجملة"
              type="number"
              step="0.01"
              value={formData.wholesalePrice}
              onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
              required
            />

            <Input
              label="سعر القطاعي"
              type="number"
              step="0.01"
              value={formData.retailPrice}
              onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
              required
            />

            <Button 
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </form>
        </Card>
      )}

      {editingPrices && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">تعديل الأسعار</h3>
          <Input
            label="سعر الجملة الجديد"
            type="number"
            step="0.01"
            value={priceData.wholesalePrice}
            onChange={(e) => setPriceData({ ...priceData, wholesalePrice: e.target.value })}
          />

          <Input
            label="سعر القطاعي الجديد"
            type="number"
            step="0.01"
            value={priceData.retailPrice}
            onChange={(e) => setPriceData({ ...priceData, retailPrice: e.target.value })}
          />

          <div className="flex gap-2">
            <Button 
              onClick={() => handleUpdatePrices(editingPrices)}
              disabled={updatingPrices}
            >
              {updatingPrices ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                setEditingPrices(null);
                setPriceData({ wholesalePrice: '', retailPrice: '' });
              }}
              disabled={updatingPrices}
            >
              إلغاء
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <Table columns={columns} data={items} />
      </Card>
    </div>
  );
}

