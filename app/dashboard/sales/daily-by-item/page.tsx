'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { formatCurrency, formatDateTime, formatNumber, sectionLabels } from '@/lib/utils';
import { generatePDF } from '@/lib/pdfUtils';

export default function DailySalesByItemPage() {
  const { user } = useUser();
  const [reportData, setReportData] = useState<any>(null);
  const [inventories, setInventories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    inventoryId: '',
    section: '',
  });

  useEffect(() => {
    loadInventories();
    loadReport();
  }, []);

  useEffect(() => {
    loadReport();
  }, [filters]);

  const loadInventories = async () => {
    try {
      const data = await api.getInventories();
      setInventories(data);
    } catch (error) {
      console.error('Error loading inventories:', error);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params: any = { date: filters.date };
      if (filters.inventoryId) params.inventoryId = filters.inventoryId;
      if (filters.section) params.section = filters.section;
      
      const data = await api.getDailySalesByItem(params);
      setReportData(data);
    } catch (error) {
      console.error('Error loading report:', error);
      alert('فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const generateReportPDF = () => {
    if (!reportData) return;

    const currentDate = new Date(reportData.date).toLocaleDateString('ar-SD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <div class="header">
        <h1>تقرير المبيعات اليومي للأصناف</h1>
        <div class="date">تاريخ التقرير: ${currentDate}</div>
        ${reportData.inventory ? `<div>المخزن: ${reportData.inventory.name}</div>` : ''}
        ${reportData.section ? `<div>القسم: ${sectionLabels[reportData.section]}</div>` : ''}
      </div>

      <div class="section">
        <h2>ملخص التقرير</h2>
        <table>
          <tr>
            <th>عدد الفواتير</th>
            <td>${reportData.summary.totalInvoices}</td>
            <th>إجمالي الإيرادات</th>
            <td>${formatCurrency(reportData.summary.totalRevenue)}</td>
          </tr>
          <tr>
            <th>عدد الأصناف المباعة</th>
            <td>${reportData.summary.totalItems}</td>
            <th>إجمالي الكمية</th>
            <td>${formatNumber(reportData.summary.totalQuantity)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>تفاصيل المبيعات حسب الأصناف</h2>
        <table>
          <thead>
            <tr>
              <th>الصنف</th>
              <th>القسم</th>
              <th>إجمالي الكمية</th>
              <th>الكمية المجانية</th>
              <th>متوسط السعر</th>
              <th>إجمالي المبلغ</th>
              <th>عدد الفواتير</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.items.map((item: any) => `
              <tr>
                <td>${item.itemName}</td>
                <td>${sectionLabels[item.section]}</td>
                <td>${formatNumber(item.totalQuantity)}</td>
                <td>${formatNumber(item.totalGiftQty)}</td>
                <td>${formatCurrency(item.averageUnitPrice)}</td>
                <td>${formatCurrency(item.totalAmount)}</td>
                <td>${item.invoiceCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${reportData.items.some((item: any) => item.invoices.length > 0) ? `
      <div class="section">
        <h2>تفاصيل الفواتير لكل صنف</h2>
        ${reportData.items.map((item: any) => `
          <div style="margin-bottom: 30px;">
            <h3>${item.itemName}</h3>
            <table>
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>العميل</th>
                  <th>الكمية</th>
                  <th>الكمية المجانية</th>
                  <th>سعر الوحدة</th>
                  <th>المجموع</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                ${item.invoices.map((inv: any) => `
                  <tr>
                    <td>${inv.invoiceNumber}</td>
                    <td>${inv.customerName}</td>
                    <td>${formatNumber(inv.quantity)}</td>
                    <td>${formatNumber(inv.giftQty)}</td>
                    <td>${formatCurrency(inv.unitPrice)}</td>
                    <td>${formatCurrency(inv.lineTotal)}</td>
                    <td>${formatDateTime(inv.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="footer">
        <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-SD')}</p>
      </div>
    `;

    generatePDF(htmlContent, `تقرير_المبيعات_اليومي_${reportData.date}`);
  };

  const itemColumns = [
    {
      key: 'itemName',
      label: 'اسم الصنف',
    },
    {
      key: 'section',
      label: 'القسم',
      render: (value: string) => sectionLabels[value] || value,
    },
    {
      key: 'totalQuantity',
      label: 'إجمالي الكمية',
      render: (value: string) => formatNumber(value),
    },
    {
      key: 'totalGiftQty',
      label: 'الكمية المجانية',
      render: (value: string) => formatNumber(value),
    },
    {
      key: 'averageUnitPrice',
      label: 'متوسط السعر',
      render: (value: string) => formatCurrency(value),
    },
    {
      key: 'totalAmount',
      label: 'إجمالي المبلغ',
      render: (value: string) => formatCurrency(value),
    },
    {
      key: 'invoiceCount',
      label: 'عدد الفواتير',
    },
  ];

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="print-container">
      <div className="no-print">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">تقرير المبيعات اليومي للأصناف</h1>
          <div className="flex gap-2">
            <Button onClick={handlePrint}>🖨️ طباعة</Button>
            <Button onClick={generateReportPDF} className="bg-blue-600 hover:bg-blue-700">
              📄 تصدير PDF
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">مرشحات البحث</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="date"
              label="التاريخ"
              value={filters.date}
              onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
            />

            <Select
              label="المخزن"
              value={filters.inventoryId}
              onChange={(e) => setFilters((prev) => ({ ...prev, inventoryId: e.target.value }))}
              options={[
                { value: '', label: 'جميع المخازن' },
                ...inventories.map((inv) => ({ value: inv.id, label: inv.name })),
              ]}
            />

            <Select
              label="القسم"
              value={filters.section}
              onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))}
              options={[
                { value: '', label: 'جميع الأقسام' },
                { value: 'GROCERY', label: 'بقالة' },
                { value: 'BAKERY', label: 'أفران' },
              ]}
            />
          </div>
        </Card>
      </div>

      {reportData && (
        <>
          <Card className="mb-6 print-break-inside-avoid">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold">تقرير المبيعات اليومي للأصناف</h2>
              <p className="text-gray-600">
                التاريخ: {new Date(reportData.date).toLocaleDateString('ar-SD', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              {reportData.inventory && (
                <p className="text-gray-600">المخزن: {reportData.inventory.name}</p>
              )}
              {reportData.section && (
                <p className="text-gray-600">القسم: {sectionLabels[reportData.section]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">عدد الفواتير</p>
                <p className="text-2xl font-bold">{reportData.summary.totalInvoices}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.summary.totalRevenue)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">عدد الأصناف</p>
                <p className="text-2xl font-bold">{reportData.summary.totalItems}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded">
                <p className="text-sm text-gray-600">إجمالي الكمية</p>
                <p className="text-2xl font-bold">{formatNumber(reportData.summary.totalQuantity)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">تفاصيل المبيعات حسب الأصناف</h2>
            <Table columns={itemColumns} data={reportData.items} />
          </Card>

          {reportData.items.some((item: any) => item.invoices.length > 0) && (
            <div className="mt-6 space-y-6">
              {reportData.items.map((item: any) => (
                <Card key={item.itemId} className="print-break-inside-avoid">
                  <h3 className="text-lg font-semibold mb-4">
                    {item.itemName} - {sectionLabels[item.section]}
                  </h3>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">إجمالي الكمية</p>
                      <p className="font-bold">{formatNumber(item.totalQuantity)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">إجمالي المبلغ</p>
                      <p className="font-bold">{formatCurrency(item.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">متوسط السعر</p>
                      <p className="font-bold">{formatCurrency(item.averageUnitPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">عدد الفواتير</p>
                      <p className="font-bold">{item.invoiceCount}</p>
                    </div>
                  </div>

                  {item.invoices.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">تفاصيل الفواتير:</h4>
                      <Table
                        columns={[
                          { key: 'invoiceNumber', label: 'رقم الفاتورة' },
                          { key: 'customerName', label: 'العميل' },
                          {
                            key: 'quantity',
                            label: 'الكمية',
                            render: (value: string) => formatNumber(value),
                          },
                          {
                            key: 'giftQty',
                            label: 'الكمية المجانية',
                            render: (value: string) => formatNumber(value),
                          },
                          {
                            key: 'unitPrice',
                            label: 'سعر الوحدة',
                            render: (value: string) => formatCurrency(value),
                          },
                          {
                            key: 'lineTotal',
                            label: 'المجموع',
                            render: (value: string) => formatCurrency(value),
                          },
                          {
                            key: 'createdAt',
                            label: 'التاريخ',
                            render: (value: string) => formatDateTime(value),
                          },
                        ]}
                        data={item.invoices}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
