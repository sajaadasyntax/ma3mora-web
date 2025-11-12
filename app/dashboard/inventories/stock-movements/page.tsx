'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { formatCurrency, formatDate, formatNumber, sectionLabels } from '@/lib/utils';
import { generatePDF } from '@/lib/pdfUtils';

export default function StockMovementsPage() {
  const { user } = useUser();
  const [reportData, setReportData] = useState<any>(null);
  const [inventories, setInventories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    inventoryId: '',
    itemId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    section: '',
  });

  useEffect(() => {
    loadInventories();
  }, []);

  const loadInventories = async () => {
    try {
      const data = await api.getInventories();
      setInventories(data);
      if (data.length > 0) {
        setFilters((prev) => ({ ...prev, inventoryId: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading inventories:', error);
    }
  };

  const loadItems = async (section?: string) => {
    try {
      const data = await api.getItems(section);
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  useEffect(() => {
    if (filters.section) {
      loadItems(filters.section);
    }
  }, [filters.section]);

  const loadReport = async () => {
    if (!filters.inventoryId) {
      alert('يرجى اختيار المخزن');
      return;
    }

    setLoading(true);
    try {
      const params: any = {
        inventoryId: filters.inventoryId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      if (filters.itemId) params.itemId = filters.itemId;
      if (filters.section) params.section = filters.section;

      const data = await api.getStockMovements(params);
      
      // Process data to add currentStock and isLastDate to each movement
      const processedData = {
        ...data,
        items: data.items.map((item: any) => ({
          ...item,
          movements: item.movements.map((movement: any, index: number, movements: any[]) => ({
            ...movement,
            currentStock: item.currentStock,
            isLastDate: index === movements.length - 1, // Mark the last date in the range
          })),
        })),
      };
      
      setReportData(processedData);
    } catch (error: any) {
      console.error('Error loading report:', error);
      alert(error.message || 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const generateReportPDF = () => {
    if (!reportData) return;

    const inventory = inventories.find((inv) => inv.id === reportData.inventoryId);

    const htmlContent = `
      <div class="header">
        <h1>تقرير حركة المخزون</h1>
        <div class="date">المخزن: ${inventory?.name || ''}</div>
        <div class="date">من ${formatDate(reportData.startDate)} إلى ${formatDate(reportData.endDate)}</div>
      </div>

      ${reportData.items.map((item: any) => `
        <div class="section">
          <h2>${item.itemName} - ${sectionLabels[item.section]}</h2>
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>رصيد افتتاحي</th>
                <th>وارد</th>
                <th>صادر</th>
                <th>صادر معلق</th>
                <th>هدايا واردة</th>
                <th>هدايا صادرة</th>
                <th>رصيد ختامي</th>
              </tr>
            </thead>
            <tbody>
              ${item.movements.map((movement: any) => `
                <tr>
                  <td>${formatDate(movement.date)}</td>
                  <td>${formatNumber(movement.openingBalance)}</td>
                  <td>${formatNumber(movement.incoming)}</td>
                  <td>${formatNumber(movement.outgoing)}</td>
                  <td>${formatNumber(movement.pendingOutgoing)}</td>
                  <td>${formatNumber(movement.incomingGifts)}</td>
                  <td>${formatNumber(movement.outgoingGifts)}</td>
                  <td>${formatNumber(movement.closingBalance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}

      <div class="footer">
        <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-SD')}</p>
      </div>
    `;

    generatePDF(htmlContent, `تقرير_حركة_المخزون_${reportData.startDate}_${reportData.endDate}`);
  };

  const movementColumns = [
    {
      key: 'date',
      label: 'التاريخ',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'openingBalance',
      label: 'رصيد افتتاحي',
      render: (value: string) => formatNumber(value),
    },
    {
      key: 'incoming',
      label: 'وارد',
      render: (value: string, row: any) => (
        <span className="text-green-600">{formatNumber(value)}</span>
      ),
    },
    {
      key: 'outgoing',
      label: 'صادر',
      render: (value: string, row: any) => (
        <span className="text-red-600">{formatNumber(value)}</span>
      ),
    },
    {
      key: 'pendingOutgoing',
      label: 'صادر معلق',
      render: (value: string, row: any) => (
        <span className="text-orange-600">{formatNumber(value)}</span>
      ),
    },
    {
      key: 'incomingGifts',
      label: 'هدايا واردة',
      render: (value: string) => formatNumber(value),
    },
    {
      key: 'outgoingGifts',
      label: 'هدايا صادرة',
      render: (value: string) => formatNumber(value),
    },
    {
      key: 'closingBalance',
      label: 'رصيد ختامي',
      render: (value: string, row: any) => {
        const closingBalance = parseFloat(value);
        const currentStock = parseFloat(row.currentStock || '0');
        // Only check mismatch for the last date in the range (most recent date)
        const isMismatch = row.isLastDate && Math.abs(closingBalance - currentStock) > 0.01; // Allow small floating point differences
        
        return (
          <span className={`font-bold ${isMismatch ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : ''}`}>
            {formatNumber(value)}
            {isMismatch && (
              <span className="ml-2 text-xs text-red-600">⚠️ لا يطابق الرصيد الحالي ({formatNumber(row.currentStock)})</span>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <div className="print-container">
      <div className="no-print">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">تقرير حركة المخزون</h1>
          <div className="flex gap-2">
            <Button onClick={handlePrint}>🖨️ طباعة</Button>
            <Button onClick={generateReportPDF} className="bg-blue-600 hover:bg-blue-700">
              📄 تصدير PDF
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">مرشحات البحث</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Select
              label="المخزن"
              value={filters.inventoryId}
              onChange={(e) => setFilters((prev) => ({ ...prev, inventoryId: e.target.value }))}
              options={inventories.map((inv) => ({ value: inv.id, label: inv.name }))}
              required
            />

            <Select
              label="القسم"
              value={filters.section}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, section: e.target.value, itemId: '' }));
                if (e.target.value) {
                  loadItems(e.target.value);
                }
              }}
              options={[
                { value: '', label: 'جميع الأقسام' },
                { value: 'GROCERY', label: 'بقالة' },
                { value: 'BAKERY', label: 'أفران' },
              ]}
            />

            <Select
              label="الصنف"
              value={filters.itemId}
              onChange={(e) => setFilters((prev) => ({ ...prev, itemId: e.target.value }))}
              options={[
                { value: '', label: 'جميع الأصناف' },
                ...items.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />

            <Input
              type="date"
              label="من تاريخ"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
            />

            <Input
              type="date"
              label="إلى تاريخ"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
            />

            <div className="flex items-end">
              <Button onClick={loadReport} disabled={loading || !filters.inventoryId}>
                {loading ? 'جاري التحميل...' : 'تحديث التقرير'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {reportData && reportData.items.length > 0 && (
        <>
          <div className="mb-6 print-break-inside-avoid">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold">تقرير حركة المخزون</h2>
              <p className="text-gray-600">
                المخزن: {inventories.find((inv) => inv.id === reportData.inventoryId)?.name}
              </p>
              <p className="text-gray-600">
                من {formatDate(reportData.startDate)} إلى {formatDate(reportData.endDate)}
              </p>
            </div>
          </div>

          {reportData.items.map((item: any) => {
            // Check if there's a mismatch for this item
            const lastMovement = item.movements[item.movements.length - 1];
            const hasMismatch = lastMovement && 
              Math.abs(parseFloat(lastMovement.closingBalance) - parseFloat(item.currentStock || '0')) > 0.01;
            
            return (
              <Card key={item.itemId} className={`mb-6 print-break-inside-avoid ${hasMismatch ? 'border-red-300 border-2' : ''}`}>
                <h3 className="text-xl font-semibold mb-4">
                  {item.itemName} - {sectionLabels[item.section]}
                  {hasMismatch && (
                    <span className="ml-2 text-sm font-normal text-red-600">
                      ⚠️ رصيد ختامي لا يطابق الرصيد الحالي ({formatNumber(item.currentStock)})
                    </span>
                  )}
                </h3>
                <Table columns={movementColumns} data={item.movements} />
              </Card>
            );
          })}
        </>
      )}

      {reportData && reportData.items.length === 0 && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات للعرض لهذه الفترة
          </div>
        </Card>
      )}
    </div>
  );
}
