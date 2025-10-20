'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CloseBalancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<any>({
    balance: null,
    sales: [],
    procurement: [],
    expenses: [],
    openingBalances: [],
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [balance, sales, procurement, expenses, openingBalances] = await Promise.all([
        api.getBalanceSummary(),
        api.getSalesInvoices(),
        api.getProcOrders(),
        api.getExpenses(),
        api.getOpeningBalances({ scope: 'CASHBOX' }),
      ]);

      setData({ balance, sales, procurement, expenses, openingBalances });
    } catch (error) {
      console.error('Error loading data:', error);
      alert('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = () => {
    if (!data.balance) return 0;
    const totalRevenue = parseFloat(data.balance.sales.received);
    const totalCosts = parseFloat(data.balance.procurement.total) + parseFloat(data.balance.expenses.total);
    return totalRevenue - totalCosts;
  };

  const generatePDF = () => {
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const profit = calculateProfit();
      const currentDate = new Date().toLocaleDateString('ar-SD');
      
      // Set font for Arabic support
      doc.setFont('helvetica');
      
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.text('Comprehensive Balance Report', 105, yPosition, { align: 'center' });
      doc.setFontSize(16);
      yPosition += 10;
      doc.text('تقرير الميزانية الشامل', 105, yPosition, { align: 'center' });
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`Date: ${currentDate}`, 105, yPosition, { align: 'center' });
      yPosition += 15;

      // Summary Section
      doc.setFontSize(14);
      doc.text('Financial Summary / الملخص المالي', 14, yPosition);
      yPosition += 8;

      const summaryData = [
        ['Opening Balance / رأس المال الافتتاحي', formatCurrency(data.balance.balance.opening)],
        ['Total Sales / إجمالي المبيعات', formatCurrency(data.balance.sales.total)],
        ['Collected Revenue / الإيرادات المحصلة', formatCurrency(data.balance.sales.received)],
        ['Outstanding Receivables / ذمم مدينة', formatCurrency(data.balance.sales.debt)],
        ['Total Procurement / إجمالي المشتريات', formatCurrency(data.balance.procurement.total)],
        ['Total Expenses / إجمالي المنصرفات', formatCurrency(data.balance.expenses.total)],
        ['Net Profit/Loss / صافي الربح/الخسارة', formatCurrency(Math.abs(profit))],
        ['Net Balance / الرصيد الصافي', formatCurrency(data.balance.balance.net)],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Description / الوصف', 'Amount / المبلغ']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202], halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Opening Balances
      if (data.openingBalances.length > 0) {
        doc.setFontSize(12);
        doc.text('Opening Balances / الأرصدة الافتتاحية', 14, yPosition);
        yPosition += 8;

        const openingData = data.openingBalances.map((bal: any) => [
          formatDate(bal.openedAt),
          bal.notes || '-',
          formatCurrency(bal.amount),
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Date / التاريخ', 'Notes / الملاحظات', 'Amount / المبلغ']],
          body: openingData,
          theme: 'striped',
          headStyles: { fillColor: [92, 184, 92] },
          styles: { fontSize: 8 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Sales Invoices
      if (data.sales.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.text('Sales Invoices / فواتير المبيعات', 14, yPosition);
        yPosition += 8;

        const salesData = data.sales.slice(0, 50).map((sale: any) => [
          sale.invoiceNumber,
          sale.customer.name,
          formatCurrency(sale.total),
          formatCurrency(sale.paidAmount),
          sale.paymentStatus,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Invoice / الفاتورة', 'Customer / العميل', 'Total / المجموع', 'Paid / المدفوع', 'Status / الحالة']],
          body: salesData,
          theme: 'striped',
          headStyles: { fillColor: [92, 184, 92] },
          styles: { fontSize: 8 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Procurement Orders
      if (data.procurement.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.text('Procurement Orders / أوامر الشراء', 14, yPosition);
        yPosition += 8;

        const procData = data.procurement.slice(0, 50).map((proc: any) => [
          proc.orderNumber,
          proc.supplier.name,
          formatCurrency(proc.total),
          proc.status,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Order / الأمر', 'Supplier / المورد', 'Total / المجموع', 'Status / الحالة']],
          body: procData,
          theme: 'striped',
          headStyles: { fillColor: [217, 83, 79] },
          styles: { fontSize: 8 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Expenses
      if (data.expenses.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.text('Expenses / المنصرفات', 14, yPosition);
        yPosition += 8;

        const expensesData = data.expenses.slice(0, 50).map((exp: any) => [
          formatDate(exp.createdAt),
          exp.description,
          formatCurrency(exp.amount),
          exp.method,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Date / التاريخ', 'Description / الوصف', 'Amount / المبلغ', 'Method / الطريقة']],
          body: expensesData,
          theme: 'striped',
          headStyles: { fillColor: [240, 173, 78] },
          styles: { fontSize: 8 },
        });
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount} - Generated on ${currentDate}`,
          105,
          290,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `balance-report-${new Date().getTime()}.pdf`;
      doc.save(fileName);

      alert('✅ تم إنشاء التقرير بنجاح!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('فشل إنشاء التقرير');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل البيانات...</div>;
  }

  const profit = calculateProfit();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">إقفال الحساب وإنشاء تقرير شامل</h1>
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/accounting')}
        >
          العودة للمحاسبة
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-lg font-semibold mb-2">إجمالي المعاملات</h3>
          <p className="text-4xl font-bold">
            {data.sales.length + data.procurement.length + data.expenses.length}
          </p>
          <div className="mt-3 text-sm space-y-1">
            <p>المبيعات: {data.sales.length}</p>
            <p>المشتريات: {data.procurement.length}</p>
            <p>المنصرفات: {data.expenses.length}</p>
          </div>
        </Card>

        <Card className={`bg-gradient-to-br ${
          profit >= 0 
            ? 'from-green-500 to-green-600' 
            : 'from-red-500 to-red-600'
        } text-white`}>
          <h3 className="text-lg font-semibold mb-2">
            {profit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}
          </h3>
          <p className="text-4xl font-bold">{formatCurrency(Math.abs(profit))}</p>
          <p className="mt-3 text-sm">
            الإيرادات: {formatCurrency(data.balance.sales.received)}
          </p>
          <p className="text-sm">
            التكاليف: {formatCurrency(
              parseFloat(data.balance.procurement.total) + parseFloat(data.balance.expenses.total)
            )}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">الرصيد الصافي</h3>
          <p className="text-4xl font-bold">{formatCurrency(data.balance.balance.net)}</p>
          <p className="mt-3 text-sm">
            رأس المال: {formatCurrency(data.balance.balance.opening)}
          </p>
          <p className="text-sm">
            ذمم مدينة: {formatCurrency(data.balance.sales.debt)}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">معاينة التقرير الشامل</h2>

        <div className="space-y-6">
          {/* Summary */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">📊 الملخص المالي</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span>رأس المال الافتتاحي:</span>
                <span className="font-semibold">{formatCurrency(data.balance.balance.opening)}</span>
              </div>
              <div className="flex justify-between">
                <span>إجمالي المبيعات:</span>
                <span className="font-semibold">{formatCurrency(data.balance.sales.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>الإيرادات المحصلة:</span>
                <span className="font-semibold text-green-600">{formatCurrency(data.balance.sales.received)}</span>
              </div>
              <div className="flex justify-between">
                <span>إجمالي المشتريات:</span>
                <span className="font-semibold text-red-600">{formatCurrency(data.balance.procurement.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>إجمالي المنصرفات:</span>
                <span className="font-semibold text-orange-600">{formatCurrency(data.balance.expenses.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>الرصيد الصافي:</span>
                <span className="font-semibold text-blue-600">{formatCurrency(data.balance.balance.net)}</span>
              </div>
            </div>
          </div>

          {/* Transactions Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-green-700">💵 فواتير المبيعات</h4>
              <p className="text-2xl font-bold">{data.sales.length}</p>
              <p className="text-sm text-gray-600 mt-1">فاتورة</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-red-700">🛒 أوامر الشراء</h4>
              <p className="text-2xl font-bold">{data.procurement.length}</p>
              <p className="text-sm text-gray-600 mt-1">أمر</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-orange-700">💸 المنصرفات</h4>
              <p className="text-2xl font-bold">{data.expenses.length}</p>
              <p className="text-sm text-gray-600 mt-1">منصرف</p>
            </div>
          </div>

          {/* Report Contents */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">📄 محتويات التقرير</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ الملخص المالي الشامل</li>
              <li>✓ الأرصدة الافتتاحية ({data.openingBalances.length})</li>
              <li>✓ جميع فواتير المبيعات ({data.sales.length})</li>
              <li>✓ جميع أوامر الشراء ({data.procurement.length})</li>
              <li>✓ جميع المنصرفات ({data.expenses.length})</li>
              <li>✓ حساب الربح والخسارة</li>
              <li>✓ الميزانية الختامية</li>
            </ul>
          </div>

          {/* Generate Button */}
          <div className="flex flex-col items-center gap-4 py-6">
            <Button
              onClick={generatePDF}
              disabled={generating}
              className="px-8 py-4 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {generating ? '⏳ جاري إنشاء التقرير...' : '📥 تحميل التقرير الشامل (PDF)'}
            </Button>
            <p className="text-sm text-gray-600 text-center max-w-2xl">
              سيتم تنزيل تقرير شامل بصيغة PDF يحتوي على جميع المعاملات المالية، الأرصدة، وحساب الأرباح والخسائر.
              يمكن استخدام هذا التقرير لإقفال الحساب أو للمراجعة المحاسبية.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

