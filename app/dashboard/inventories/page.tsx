'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Select from '@/components/Select';
import Table from '@/components/Table';
import { formatNumber, formatDateTime, sectionLabels } from '@/lib/utils';

export default function InventoriesPage() {
  const [inventories, setInventories] = useState<any[]>([]);
  const [selectedInventory, setSelectedInventory] = useState('');
  const [selectedSection, setSelectedSection] = useState('GROCERY');
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventories();
  }, []);

  useEffect(() => {
    if (selectedInventory) {
      loadStocks();
    }
  }, [selectedInventory, selectedSection]);

  const loadInventories = async () => {
    try {
      const data = await api.getInventories();
      setInventories(data);
      if (data.length > 0) {
        setSelectedInventory(data[0].id);
      }
    } catch (error) {
      console.error('Error loading inventories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStocks = async () => {
    try {
      const data = await api.getInventoryStocks(selectedInventory, selectedSection);
      setStocks(data);
    } catch (error) {
      console.error('Error loading stocks:', error);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string | null): number | null => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const columns = [
    {
      key: 'item',
      label: 'اسم الصنف',
      render: (value: any) => value.name,
    },
    {
      key: 'quantity',
      label: 'الكمية المتوفرة',
      render: (value: any) => formatNumber(value),
    },
    {
      key: 'expiryInfo',
      label: 'حالة الصلاحية',
      render: (value: any) => {
        if (!value) return <span className="text-gray-400">-</span>;
        
        if (value.hasExpired) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-800 text-sm font-semibold">
              ⚠ منتهي الصلاحية ({formatNumber(value.expiredQuantity)})
            </span>
          );
        }
        
        if (value.expiringSoon) {
          const daysUntilExpiry = value.earliestExpiry ? getDaysUntilExpiry(value.earliestExpiry) : null;
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-800 text-sm font-semibold">
              ⚠ ينتهي قريباً ({daysUntilExpiry !== null ? `${daysUntilExpiry} يوم` : '-'})
            </span>
          );
        }
        
        if (value.earliestExpiry) {
          const daysUntilExpiry = getDaysUntilExpiry(value.earliestExpiry);
          if (daysUntilExpiry !== null && daysUntilExpiry <= 60) {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-sm">
                ينتهي خلال {daysUntilExpiry} يوم
              </span>
            );
          }
          return (
            <span className="text-green-600 text-sm">
              {formatDateTime(value.earliestExpiry)}
            </span>
          );
        }
        
        return <span className="text-gray-400">لا يوجد تاريخ صلاحية</span>;
      },
    },
    {
      key: 'earliestExpiry',
      label: 'أقرب تاريخ انتهاء',
      render: (_: any, row: any) => {
        const expiryInfo = row.expiryInfo;
        if (!expiryInfo?.earliestExpiry) return <span className="text-gray-400">-</span>;
        return formatDateTime(expiryInfo.earliestExpiry);
      },
    },
    {
      key: 'wholesalePrice',
      label: 'سعر الجملة',
      render: (_: any, row: any) => {
        const price = row.item.prices.find((p: any) => p.tier === 'WHOLESALE');
        return price ? formatNumber(price.price) : '-';
      },
    },
    {
      key: 'retailPrice',
      label: 'سعر القطاعي',
      render: (_: any, row: any) => {
        const price = row.item.prices.find((p: any) => p.tier === 'RETAIL');
        return price ? formatNumber(price.price) : '-';
      },
    },
  ];

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  const totalItems = stocks.length;
  const totalQuantity = stocks.reduce((sum, stock) => sum + parseFloat(stock.quantity), 0);
  const lowStockItems = stocks.filter((stock) => parseFloat(stock.quantity) < 50).length;
  const outOfStockItems = stocks.filter((stock) => parseFloat(stock.quantity) === 0).length;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">المخازن</h1>

      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="المخزن"
            value={selectedInventory}
            onChange={(e) => setSelectedInventory(e.target.value)}
            options={inventories.map((inv) => ({ value: inv.id, label: inv.name }))}
          />

          <Select
            label="القسم"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            options={[
              { value: 'GROCERY', label: 'بقالة' },
              { value: 'BAKERY', label: 'أفران' },
            ]}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-sm font-semibold mb-1">إجمالي الأصناف</h3>
          <p className="text-3xl font-bold">{totalItems}</p>
          <p className="text-xs mt-1">صنف متاح</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-sm font-semibold mb-1">إجمالي الكمية</h3>
          <p className="text-3xl font-bold">{formatNumber(totalQuantity)}</p>
          <p className="text-xs mt-1">وحدة في المخزون</p>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <h3 className="text-sm font-semibold mb-1">مخزون منخفض</h3>
          <p className="text-3xl font-bold">{lowStockItems}</p>
          <p className="text-xs mt-1">أقل من 50 وحدة</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <h3 className="text-sm font-semibold mb-1">نفذ من المخزون</h3>
          <p className="text-3xl font-bold">{outOfStockItems}</p>
          <p className="text-xs mt-1">صنف</p>
        </Card>

        <Card className={`bg-gradient-to-br ${
          stocks.filter(s => s.expiryInfo?.expiringSoon).length > 0
            ? 'from-orange-500 to-orange-600'
            : 'from-yellow-500 to-yellow-600'
        } text-white`}>
          <h3 className="text-sm font-semibold mb-1">ينتهي قريباً</h3>
          <p className="text-3xl font-bold">
            {stocks.filter(s => s.expiryInfo?.expiringSoon).length}
          </p>
          <p className="text-xs mt-1">في 30 يوم</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-700 to-red-800 text-white">
          <h3 className="text-sm font-semibold mb-1">منتهي الصلاحية</h3>
          <p className="text-3xl font-bold">
            {stocks.filter(s => s.expiryInfo?.hasExpired).length}
          </p>
          <p className="text-xs mt-1">صنف</p>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {inventories.find((i) => i.id === selectedInventory)?.name} -{' '}
            {sectionLabels[selectedSection]}
          </h2>
          <div className="flex gap-2">
            <a
              href="/dashboard/inventories/transfers"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
            >
              نقل الأصناف
            </a>
            <a
              href="/dashboard/inventories/stock-movements"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold"
            >
              تقرير حركة المخزون
            </a>
          </div>
        </div>
        <Table columns={columns} data={stocks} />
      </Card>
    </div>
  );
}

