'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import { formatCurrency, formatDateTime, procOrderStatusLabels, sectionLabels } from '@/lib/utils';

interface PageProps {
  params: {
    id: string;
  };
}

export default function SupplierDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const [suppliers, ordersData] = await Promise.all([
        api.getSuppliers(),
        api.getSupplierOrders(params.id),
      ]);
      
      const found = suppliers.find((s: any) => s.id === params.id);
      if (found) {
        setSupplier(found);
        setOrders(ordersData);
      } else {
        throw new Error('المورد غير موجود');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('فشل تحميل بيانات المورد');
      router.push('/dashboard/suppliers');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics and outstanding balances
  const calculateStats = () => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'CREATED').length;
    const partialOrders = orders.filter(o => o.status === 'PARTIAL').length;
    const completedOrders = orders.filter(o => o.status === 'RECEIVED').length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
    
    const totalValue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const pendingValue = orders
      .filter(o => o.status === 'CREATED' || o.status === 'PARTIAL')
      .reduce((sum, order) => sum + parseFloat(order.total), 0);
    
    // Accounts payable (what we owe supplier)
    const accountsPayable = orders.reduce((sum, order) => {
      const orderTotal = parseFloat(order.total);
      const paidAmount = parseFloat(order.paidAmount);
      return sum + (orderTotal - paidAmount);
    }, 0);
    
    // Opening balance: positive = supplier owes us, negative = we owe supplier
    // Note: We'll need to fetch this from API, but for now assume 0
    const openingBalance = 0; // Will be updated when API includes it
    
    // Net outstanding: positive = we owe supplier, negative = supplier owes us
    const netOutstanding = accountsPayable - openingBalance;

    return {
      totalOrders,
      pendingOrders,
      partialOrders,
      completedOrders,
      cancelledOrders,
      totalValue,
      pendingValue,
      accountsPayable,
      openingBalance,
      netOutstanding,
    };
  };

  const stats = calculateStats();

  const orderColumns = [
    { key: 'orderNumber', label: 'رقم الأمر' },
    { key: 'inventory', label: 'المخزن', render: (value: any) => value.name },
    { key: 'section', label: 'القسم', render: (value: any) => sectionLabels[value] },
    {
      key: 'total',
      label: 'القيمة الإجمالية',
      render: (value: any) => formatCurrency(value),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (value: any) => (
        <span
          className={`inline-block px-2 py-1 rounded text-sm ${
            value === 'RECEIVED'
              ? 'bg-green-100 text-green-800'
              : value === 'PARTIAL'
              ? 'bg-yellow-100 text-yellow-800'
              : value === 'CANCELLED'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {procOrderStatusLabels[value]}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'تاريخ الإنشاء',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'paymentConfirmed',
      label: 'تأكيد الدفع',
      render: (value: boolean) => (
        <span className={`inline-block px-2 py-1 rounded text-sm ${
          value ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          {value ? '✓ مؤكد' : '⏳ في الانتظار'}
        </span>
      ),
    },
  ];

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!supplier) {
    return <div className="text-center py-8">المورد غير موجود</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="secondary" onClick={() => router.push('/dashboard/suppliers')}>
            ← رجوع
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Supplier Info */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">{supplier.name}</h2>
          <div className="grid grid-cols-2 gap-4">
            {supplier.phone && (
              <div>
                <p className="text-gray-600">رقم الهاتف</p>
                <p className="font-semibold">{supplier.phone}</p>
              </div>
            )}
            {supplier.address && (
              <div>
                <p className="text-gray-600">العنوان</p>
                <p className="font-semibold">{supplier.address}</p>
              </div>
            )}
            <div>
              <p className="text-gray-600">تاريخ الإضافة</p>
              <p className="font-semibold">
                {new Date(supplier.createdAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </Card>

        {/* Financial Summary */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">الملخص المالي</h3>
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">إجمالي القيمة</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-1">المدفوع</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalValue - stats.accountsPayable)}</p>
            </div>
            <div className={`p-4 rounded-lg border ${
              stats.accountsPayable > 0 
                ? 'bg-red-50 border-red-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-sm text-gray-600 mb-1">الذمم الدائنة (من الأوامر)</p>
              <p className={`text-2xl font-bold ${
                stats.accountsPayable > 0 ? 'text-red-700' : 'text-gray-700'
              }`}>
                {formatCurrency(stats.accountsPayable)}
              </p>
            </div>
          </div>
          
          {/* Opening Balance Info */}
          {stats.openingBalance !== 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-600 mb-1">
                {stats.openingBalance > 0 
                  ? 'رصيد افتتاحي (المورد مدين لنا)' 
                  : 'رصيد افتتاحي (نحن مدينون للمورد)'}
              </p>
              <p className={`text-xl font-bold ${
                stats.openingBalance > 0 ? 'text-purple-700' : 'text-orange-700'
              }`}>
                {stats.openingBalance > 0 ? '+' : ''}{formatCurrency(stats.openingBalance)}
              </p>
            </div>
          )}
          
          {/* Net Outstanding */}
          <div className={`mt-4 p-4 rounded-lg border ${
            stats.netOutstanding > 0 
              ? 'bg-red-50 border-red-300' 
              : stats.netOutstanding < 0
              ? 'bg-orange-50 border-orange-300'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {stats.netOutstanding > 0 
                ? '✅ المتبقي الإجمالي: نحن مدينون للمورد' 
                : stats.netOutstanding < 0
                ? '⚠️ المتبقي الإجمالي: المورد مدين لنا'
                : '✓ المتبقي الإجمالي: متساوي'}
            </p>
            <p className={`text-2xl font-bold ${
              stats.netOutstanding > 0 ? 'text-red-700' : 
              stats.netOutstanding < 0 ? 'text-orange-700' : 'text-gray-700'
            }`}>
              {formatCurrency(Math.abs(stats.netOutstanding))}
            </p>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-lg font-semibold mb-2">إجمالي الأوامر</h3>
            <p className="text-3xl font-bold">{stats.totalOrders}</p>
            <p className="text-sm mt-2">إجمالي القيمة: {formatCurrency(stats.totalValue)}</p>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <h3 className="text-lg font-semibold mb-2">الأوامر المعلقة</h3>
            <p className="text-3xl font-bold">{stats.pendingOrders + stats.partialOrders}</p>
            <p className="text-sm mt-2">قيمة معلقة: {formatCurrency(stats.pendingValue)}</p>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-lg font-semibold mb-2">الأوامر المكتملة</h3>
            <p className="text-3xl font-bold">{stats.completedOrders}</p>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <h3 className="text-lg font-semibold mb-2">الأوامر الجزئية</h3>
            <p className="text-3xl font-bold">{stats.partialOrders}</p>
            <p className="text-sm mt-2">تحتاج متابعة</p>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">أوامر الشراء</h3>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد أوامر شراء لهذا المورد
            </div>
          ) : (
            <Table columns={orderColumns} data={orders} />
          )}
        </Card>
      </div>
    </div>
  );
}

