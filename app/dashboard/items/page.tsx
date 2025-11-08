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
  const [allItems, setAllItems] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
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
    agentPrice: '',
  });
  const [priceData, setPriceData] = useState({
    wholesalePrice: '',
    retailPrice: '',
    agentPrice: '',
    inventoryId: '',
  });

  useEffect(() => {
    loadInventories();
    loadItems();
  }, []);

  useEffect(() => {
    // Filter items when section changes or when allItems is loaded
    if (allItems.length > 0) {
      if (selectedSection) {
        const filtered = allItems.filter(item => item.section === selectedSection);
        setItems(filtered);
      } else {
        setItems(allItems);
      }
    }
  }, [selectedSection, allItems]);

  const loadInventories = async () => {
    try {
      const data = await api.getInventories();
      setInventories(data);
      if (data.length > 0) {
        setSelectedInventory(data[0].id);
      }
    } catch (error) {
      console.error('Error loading inventories:', error);
    }
  };

  const loadItems = async () => {
    try {
      const data = await api.getItems();
      setAllItems(data);
      // Apply initial filter if section is selected
      if (selectedSection) {
        const filtered = data.filter(item => item.section === selectedSection);
        setItems(filtered);
      } else {
        setItems(data);
      }
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
        agentPrice: formData.agentPrice ? parseFloat(formData.agentPrice) : undefined,
      });
      setShowForm(false);
      setFormData({
        name: '',
        section: 'GROCERY',
        wholesalePrice: '',
        retailPrice: '',
        agentPrice: '',
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
        agentPrice: priceData.agentPrice ? parseFloat(priceData.agentPrice) : undefined,
        inventoryId: priceData.inventoryId || undefined,
      });
      setEditingPrices(null);
      setPriceData({ wholesalePrice: '', retailPrice: '', agentPrice: '', inventoryId: '' });
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

  const getLatestPrices = (item: any, inventoryId?: string) => {
    // Filter prices by inventory: prefer inventory-specific, fallback to global (inventoryId = null)
    const pricesForInventory = item.prices.filter((p: any) => {
      if (inventoryId) {
        return p.inventoryId === inventoryId || p.inventoryId === null;
      }
      return true; // Show all prices if no inventory selected
    });
    
    // Get latest prices (most recent validFrom) for each tier
    const wholesale = pricesForInventory
      .filter((p: any) => p.tier === 'WHOLESALE')
      .sort((a: any, b: any) => {
        // Prefer inventory-specific over global
        if (a.inventoryId && !b.inventoryId) return -1;
        if (!a.inventoryId && b.inventoryId) return 1;
        // Then by validFrom
        return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
      })[0];
    
    const retail = pricesForInventory
      .filter((p: any) => p.tier === 'RETAIL')
      .sort((a: any, b: any) => {
        // Prefer inventory-specific over global
        if (a.inventoryId && !b.inventoryId) return -1;
        if (!a.inventoryId && b.inventoryId) return 1;
        // Then by validFrom
        return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
      })[0];
    
    const agent = pricesForInventory
      .filter((p: any) => p.tier === 'AGENT')
      .sort((a: any, b: any) => {
        // Prefer inventory-specific over global
        if (a.inventoryId && !b.inventoryId) return -1;
        if (!a.inventoryId && b.inventoryId) return 1;
        // Then by validFrom
        return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
      })[0];
    
    return { wholesale, retail, agent };
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
      label: selectedInventory ? `سعر الجملة (${inventories.find(i => i.id === selectedInventory)?.name || ''})` : 'سعر الجملة',
      render: (_: any, row: any) => {
        const prices = getLatestPrices(row, selectedInventory);
        if (prices.wholesale) {
          const isInventorySpecific = prices.wholesale.inventoryId === selectedInventory;
          return (
            <span className={isInventorySpecific ? 'font-semibold' : ''}>
              {formatCurrency(prices.wholesale.price)}
              {!isInventorySpecific && prices.wholesale.inventoryId === null && selectedInventory && (
                <span className="text-xs text-gray-500 mr-1">(عام)</span>
              )}
            </span>
          );
        }
        return '-';
      },
    },
    {
      key: 'retailPrice',
      label: selectedInventory ? `سعر القطاعي (${inventories.find(i => i.id === selectedInventory)?.name || ''})` : 'سعر القطاعي',
      render: (_: any, row: any) => {
        const prices = getLatestPrices(row, selectedInventory);
        if (prices.retail) {
          const isInventorySpecific = prices.retail.inventoryId === selectedInventory;
          return (
            <span className={isInventorySpecific ? 'font-semibold' : ''}>
              {formatCurrency(prices.retail.price)}
              {!isInventorySpecific && prices.retail.inventoryId === null && selectedInventory && (
                <span className="text-xs text-gray-500 mr-1">(عام)</span>
              )}
            </span>
          );
        }
        return '-';
      },
    },
    {
      key: 'agentPrice',
      label: selectedInventory ? `سعر الوكيل (${inventories.find(i => i.id === selectedInventory)?.name || ''})` : 'سعر الوكيل',
      render: (_: any, row: any) => {
        const prices = getLatestPrices(row, selectedInventory);
        if (prices.agent) {
          const isInventorySpecific = prices.agent.inventoryId === selectedInventory;
          return (
            <span className={isInventorySpecific ? 'font-semibold' : ''}>
              {formatCurrency(prices.agent.price)}
              {!isInventorySpecific && prices.agent.inventoryId === null && selectedInventory && (
                <span className="text-xs text-gray-500 mr-1">(عام)</span>
              )}
            </span>
          );
        }
        return '-';
      },
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          {(user?.role === 'ACCOUNTANT' || user?.role === 'MANAGER') && (
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
        <div className="flex gap-4 items-center">
          <Select
            label="القسم"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            options={[
              { value: '', label: 'جميع الأقسام' },
              { value: 'GROCERY', label: 'بقالات' },
              { value: 'BAKERY', label: 'أفران' },
            ]}
          />
          <Select
            label="المخزن"
            value={selectedInventory}
            onChange={(e) => setSelectedInventory(e.target.value)}
            options={[
              { value: '', label: 'جميع المخازن' },
              ...inventories.map((inv) => ({ value: inv.id, label: inv.name })),
            ]}
          />
          {(user?.role === 'PROCUREMENT' || user?.role === 'MANAGER') && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'إلغاء' : 'إضافة صنف جديد'}
            </Button>
          )}
        </div>
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

            <Input
              label="سعر الوكيل (اختياري)"
              type="number"
              step="0.01"
              value={formData.agentPrice}
              onChange={(e) => setFormData({ ...formData, agentPrice: e.target.value })}
              placeholder="إذا لم يتم تحديده، سيستخدم سعر القطاعي"
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
          <Select
            label="المخزن (اختياري - فارغ يعني جميع المخازن)"
            value={priceData.inventoryId}
            onChange={(e) => setPriceData({ ...priceData, inventoryId: e.target.value })}
            options={[
              { value: '', label: 'جميع المخازن (سعر عام)' },
              ...inventories.map((inv) => ({ value: inv.id, label: inv.name })),
            ]}
          />
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

          <Input
            label="سعر الوكيل الجديد (اختياري)"
            type="number"
            step="0.01"
            value={priceData.agentPrice}
            onChange={(e) => setPriceData({ ...priceData, agentPrice: e.target.value })}
            placeholder="اتركه فارغاً للحفاظ على السعر الحالي"
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
                setPriceData({ wholesalePrice: '', retailPrice: '', agentPrice: '', inventoryId: '' });
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

