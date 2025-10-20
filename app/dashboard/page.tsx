'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useUser();
  const [inventories, setInventories] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const inventoriesRes = await api.getInventories();
      setInventories(inventoriesRes);

      // Only load balance for accountant and auditor
      if (user && (user.role === 'ACCOUNTANT' || user.role === 'AUDITOR')) {
        const balanceRes = await api.getBalanceSummary().catch(() => null);
        setBalance(balanceRes);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-lg font-semibold mb-2">المخازن</h3>
          <p className="text-3xl font-bold">{inventories.length}</p>
        </Card>

        {balance && (
          <>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <h3 className="text-lg font-semibold mb-2">إجمالي المبيعات</h3>
              <p className="text-2xl font-bold">{formatCurrency(balance.sales.total)}</p>
              <p className="text-sm mt-1">{balance.sales.count} فاتورة</p>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <h3 className="text-lg font-semibold mb-2">إجمالي المشتريات</h3>
              <p className="text-2xl font-bold">{formatCurrency(balance.procurement.total)}</p>
              <p className="text-sm mt-1">{balance.procurement.count} أمر شراء</p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <h3 className="text-lg font-semibold mb-2">الرصيد الصافي</h3>
              <p className="text-2xl font-bold">{formatCurrency(balance.balance.net)}</p>
            </Card>
          </>
        )}
      </div>

      <Card title="المخازن المتاحة">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inventories.map((inventory) => (
            <div
              key={inventory.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h3 className="font-semibold text-lg">{inventory.name}</h3>
              {inventory.isMain && (
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  مخزن رئيسي
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

