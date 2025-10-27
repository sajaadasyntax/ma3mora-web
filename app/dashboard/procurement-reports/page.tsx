'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Input from '@/components/Input';
import { formatCurrency, formatDateTime, procOrderStatusLabels, sectionLabels } from '@/lib/utils';

export default function ProcurementReportsPage() {
  const { user } = useUser();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'daily',
    inventoryId: '',
    section: '',
    status: '',
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.period) params.period = filters.period;
      if (filters.inventoryId) params.inventoryId = filters.inventoryId;
      if (filters.section) params.section = filters.section;
      if (filters.status) params.status = filters.status;

      const data = await api.getProcurementReports(params);
      setReportData(data);
    } catch (error) {
      console.error('Error loading procurement reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadReports();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      period: 'daily',
      inventoryId: '',
      section: '',
      status: '',
    });
    loadReports();
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">تقارير المشتريات</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ البداية
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ النهاية
            </label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفترة
            </label>
            <Select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              options={[
                { value: 'daily', label: 'يومي' },
                { value: 'monthly', label: 'شهري' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              القسم
            </label>
            <Select
              value={filters.section}
              onChange={(e) => handleFilterChange('section', e.target.value)}
              options={[
                { value: '', label: 'جميع الأقسام' },
                { value: 'GROCERY', label: sectionLabels.GROCERY },
                { value: 'BAKERY', label: sectionLabels.BAKERY },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              حالة الأمر
            </label>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: '', label: 'جميع الحالات' },
                { value: 'CREATED', label: procOrderStatusLabels.CREATED },
                { value: 'RECEIVED', label: procOrderStatusLabels.RECEIVED },
                { value: 'PARTIAL', label: procOrderStatusLabels.PARTIAL },
                { value: 'CANCELLED', label: procOrderStatusLabels.CANCELLED },
              ]}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleApplyFilters} className="flex-1">
              تطبيق
            </Button>
            <Button onClick={handleResetFilters} variant="secondary" className="flex-1">
              إعادة تعيين
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary */}
      {reportData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reportData.summary.totalOrders}
              </div>
              <div className="text-sm text-gray-600">إجمالي الأوامر</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(reportData.summary.totalAmount)}
              </div>
              <div className="text-sm text-gray-600">إجمالي المشتريات</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {reportData.summary.paidOrders}
              </div>
              <div className="text-sm text-gray-600">أوامر مدفوعة</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {reportData.summary.unpaidOrders}
              </div>
              <div className="text-sm text-gray-600">أوامر غير مدفوعة</div>
            </div>
          </Card>
        </div>
      )}

      {/* Report Data */}
      {reportData?.data && (
        <div className="space-y-6">
          {reportData.data.map((periodData: any, index: number) => (
            <Card key={index}>
              <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {filters.period === 'daily' 
                    ? formatDateTime(periodData.date)
                    : `${periodData.month}`
                  }
                </h3>
                <div className="flex gap-6 mt-2 text-sm text-gray-600">
                  <span>عدد الأوامر: {periodData.orderCount}</span>
                  <span>إجمالي المشتريات: {formatCurrency(periodData.totalAmount)}</span>
                </div>
              </div>

              {/* Status Summary */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-3">حالات الأوامر</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(periodData.statuses).map(([status, data]: [string, any]) => (
                    <div key={status} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium">{procOrderStatusLabels[status]}</div>
                      <div className="text-sm text-gray-600">
                        {data.count} أمر - {formatCurrency(data.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suppliers Summary */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-3">الموردين</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(periodData.suppliers).map(([supplierName, data]: [string, any]) => (
                    <div key={supplierName} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium">{supplierName}</div>
                      <div className="text-sm text-gray-600">
                        {data.count} أمر - {formatCurrency(data.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Summary */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-3">الأصناف المشتراة</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الصنف
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الكمية
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          تكلفة الوحدة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الإجمالي
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(periodData.items).map(([itemName, itemData]: [string, any]) => (
                        <tr key={itemName}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {itemName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {itemData.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(itemData.unitCost)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(itemData.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Orders */}
              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-3">تفاصيل الأوامر</h4>
                <div className="space-y-2">
                  {periodData.orders.map((order: any) => (
                    <div key={order.id} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-sm text-gray-600">
                            المورد: {order.supplier.name} | 
                            المخزن: {order.inventory.name} |
                            الحالة: {procOrderStatusLabels[order.status]} |
                            الدفع: {order.paymentConfirmed ? '✓ مؤكد' : '⏳ معلق'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(order.total)}</div>
                          <div className="text-sm text-gray-600">
                            {formatDateTime(order.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {reportData?.data?.length === 0 && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات للفترة المحددة
          </div>
        </Card>
      )}
    </div>
  );
}
