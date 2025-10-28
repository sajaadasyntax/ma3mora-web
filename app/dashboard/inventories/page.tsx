'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Select from '@/components/Select';
import Table from '@/components/Table';
import { formatNumber, formatDateTime, sectionLabels } from '@/lib/utils';

export default function InventoriesPage() {
  const { user } = useUser();
  const [inventories, setInventories] = useState<any[]>([]);
  const [selectedInventory, setSelectedInventory] = useState('');
  const [selectedSection, setSelectedSection] = useState('GROCERY');
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const groupBatchesByExpiry = (batches: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    batches.forEach((batch) => {
      const expiryKey = batch.expiryDate 
        ? new Date(batch.expiryDate).toISOString().split('T')[0] // Group by date
        : 'no-expiry';
      
      if (!groups[expiryKey]) {
        groups[expiryKey] = [];
      }
      groups[expiryKey].push(batch);
    });
    
    return groups;
  };

  const isInventoryUser = user?.role === 'INVENTORY';

  const columns = [
    {
      key: 'item',
      label: 'اسم الصنف',
      render: (value: any, row: any) => {
        const hasBatches = row.batches && row.batches.length > 0;
        const isExpanded = expandedItems.has(row.itemId);
        const canExpand = isInventoryUser && hasBatches;
        
        return (
          <div className="flex items-center gap-2">
            {canExpand && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(row.itemId);
                }}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            <span>{value.name}</span>
            {hasBatches && isInventoryUser && (
              <span className="text-xs text-gray-500">
              ({row.batches.length} دفعة)
              </span>
            )}
          </div>
        );
      },
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
        
        {/* Expanded batches for inventory users */}
        {isInventoryUser && stocks.map((stock) => {
          if (!expandedItems.has(stock.itemId) || !stock.batches || stock.batches.length === 0) {
            return null;
          }
          
          const batchesByExpiry = groupBatchesByExpiry(stock.batches);
          const expiryKeys = Object.keys(batchesByExpiry).sort((a, b) => {
            if (a === 'no-expiry') return 1;
            if (b === 'no-expiry') return -1;
            return a.localeCompare(b);
          });
          
          return (
            <div key={stock.itemId} className="mt-4 border-t pt-4">
              <h3 className="font-semibold mb-3 text-lg">
                دفعات {stock.item.name} - ({stock.batches.length} دفعة)
              </h3>
              <div className="space-y-4">
                {expiryKeys.map((expiryKey) => {
                  const batches = batchesByExpiry[expiryKey];
                  const totalQty = batches.reduce((sum, b) => sum + parseFloat(b.quantity), 0);
                  const isExpired = expiryKey !== 'no-expiry' && new Date(expiryKey) < new Date();
                  const daysUntilExpiry = expiryKey !== 'no-expiry' 
                    ? getDaysUntilExpiry(expiryKey) 
                    : null;
                  
                  return (
                    <div 
                      key={expiryKey} 
                      className={`border rounded-lg p-4 ${
                        isExpired 
                          ? 'bg-red-50 border-red-200' 
                          : daysUntilExpiry !== null && daysUntilExpiry <= 30
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {expiryKey === 'no-expiry' 
                              ? 'لا يوجد تاريخ صلاحية' 
                              : `تاريخ الصلاحية: ${formatDateTime(expiryKey)}`}
                          </h4>
                          {daysUntilExpiry !== null && (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              isExpired
                                ? 'bg-red-200 text-red-800'
                                : daysUntilExpiry <= 7
                                ? 'bg-red-100 text-red-700'
                                : daysUntilExpiry <= 30
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {isExpired 
                                ? 'منتهي' 
                                : daysUntilExpiry <= 30
                                ? `${daysUntilExpiry} يوم متبقي`
                                : `${daysUntilExpiry} يوم متبقي`}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-lg">
                          الكمية: {formatNumber(totalQty)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                        {batches.map((batch: any) => (
                          <div 
                            key={batch.id} 
                            className="bg-white border rounded p-3 text-sm"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">الكمية:</span>
                              <span className="font-semibold text-blue-600">
                                {formatNumber(batch.quantity)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              <div>تاريخ الاستلام: {formatDateTime(batch.receivedAt)}</div>
                              {batch.receipt && batch.receipt.order && (
                                <div className="mt-1">
                                  <div>من أمر: {batch.receipt.order.orderNumber}</div>
                                  {batch.receipt.order.supplier && (
                                    <div>المورد: {batch.receipt.order.supplier.name}</div>
                                  )}
                                </div>
                              )}
                              {batch.notes && (
                                <div className="mt-1">ملاحظات: {batch.notes}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

