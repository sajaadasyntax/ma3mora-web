'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { formatCurrency, formatDateTime, paymentMethodLabels } from '@/lib/utils';
import { generatePDF } from '@/lib/pdfUtils';

export default function DailyIncomeLossPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [filters, setFilters] = useState({
    date: '',
    startDate: '',
    endDate: '',
    mode: 'single', // 'single' or 'range'
    method: '', // 'CASH', 'BANK', 'BANK_NILE', or '' for all
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.mode === 'single' && filters.date) {
        params.date = filters.date;
      } else if (filters.mode === 'range' && filters.startDate && filters.endDate) {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      }
      if (filters.method) {
        params.method = filters.method;
      }
      
      const data = await api.getDailyIncomeLoss(params);
      setReportData(data);
    } catch (error) {
      console.error('Error loading income/loss report:', error);
      alert('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportData) return;
    
    const currentDate = new Date().toLocaleDateString('ar-SD', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const dateRange = filters.mode === 'single' && filters.date
      ? new Date(filters.date).toLocaleDateString('ar-SD', { year: 'numeric', month: 'long', day: 'numeric' })
      : filters.mode === 'range' && filters.startDate && filters.endDate
      ? `${new Date(filters.startDate).toLocaleDateString('ar-SD')} - ${new Date(filters.endDate).toLocaleDateString('ar-SD')}`
      : 'اليوم';
    
    const methodLabel = filters.method ? ` | طريقة الدفع: ${paymentMethodLabels[filters.method as keyof typeof paymentMethodLabels] || filters.method}` : '';

    let html = `
      <div class="header">
        <h1>تقرير الإيرادات والمنصرفات اليومي</h1>
        <div class="date">تاريخ التقرير: ${currentDate} | الفترة: ${dateRange}${methodLabel}</div>
      </div>

      <div class="section">
        <h2>الملخص الإجمالي</h2>
        <table>
          <thead>
            <tr>
              <th>البند</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>إجمالي الإيرادات</td>
              <td class="positive">${formatCurrency(parseFloat(reportData.summary.totalIncome))}</td>
            </tr>
            <tr>
              <td>إجمالي المنصرفات</td>
              <td class="negative">${formatCurrency(parseFloat(reportData.summary.totalLosses))}</td>
            </tr>
            <tr>
              <td><strong>صافي الربح/الخسارة</strong></td>
              <td><strong class="${parseFloat(reportData.summary.netProfit) >= 0 ? 'positive' : 'negative'}">${formatCurrency(Math.abs(parseFloat(reportData.summary.netProfit)))}</strong></td>
            </tr>
            <tr>
              <td>عدد الأيام</td>
              <td>${reportData.summary.totalDays}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    reportData.dailyReports.forEach((day: any) => {
      const dayDate = new Date(day.date).toLocaleDateString('ar-SD', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      html += `
        <div class="section">
          <h2>التاريخ: ${dayDate}</h2>
          
          <div class="summary">
            <div class="summary-row">
              <span>إجمالي الإيرادات:</span>
              <span class="amount positive">${formatCurrency(parseFloat(day.totalIncome))}</span>
            </div>
            <div class="summary-row">
              <span>إجمالي المنصرفات:</span>
              <span class="amount negative">${formatCurrency(parseFloat(day.totalLosses))}</span>
            </div>
            <div class="summary-row total">
              <span>صافي الربح/الخسارة:</span>
              <span class="amount ${parseFloat(day.netProfit) >= 0 ? 'positive' : 'negative'}">${formatCurrency(Math.abs(parseFloat(day.netProfit)))}</span>
            </div>
          </div>

          <h3>الإيرادات (${day.incomeCount} معاملة)</h3>
          <table>
            <thead>
              <tr>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>طريقة الدفع</th>
                <th>التاريخ</th>
                <th>التفاصيل</th>
                <th>سجل بواسطة</th>
              </tr>
            </thead>
            <tbody>
              ${day.income.map((inc: any) => {
                let details = '';
                if (inc.type === 'SALES_PAYMENT') {
                  details = `فاتورة: ${inc.details.invoiceNumber}<br/>العميل: ${inc.details.customer}<br/>المخزن: ${inc.details.inventory}`;
                  if (inc.details.receiptNumber) details += `<br/>رقم الإيصال: ${inc.details.receiptNumber}`;
                }
                if (inc.details.notes) details += `<br/>ملاحظات: ${inc.details.notes}`;
                return `
                  <tr>
                    <td>${inc.typeLabel}</td>
                    <td class="positive">${formatCurrency(parseFloat(inc.amount))}</td>
                    <td>${paymentMethodLabels[inc.method] || inc.method}</td>
                    <td>${new Date(inc.date).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${details || '-'}</td>
                    <td>${inc.recordedBy}</td>
                  </tr>
                `;
              }).join('')}
              ${day.income.length === 0 ? '<tr><td colspan="6" class="text-center">لا توجد إيرادات</td></tr>' : ''}
            </tbody>
          </table>

          <h3>المنصرفات (${day.lossesCount} معاملة)</h3>
          <table>
            <thead>
              <tr>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>طريقة الدفع</th>
                <th>التاريخ</th>
                <th>التفاصيل</th>
                <th>سجل بواسطة</th>
              </tr>
            </thead>
            <tbody>
              ${day.losses.map((loss: any) => {
                let details = '';
                if (loss.type === 'PROCUREMENT_PAYMENT') {
                  details = `أمر: ${loss.details.orderNumber}<br/>المورد: ${loss.details.supplier}<br/>المخزن: ${loss.details.inventory}`;
                  if (loss.details.receiptNumber) details += `<br/>رقم الإيصال: ${loss.details.receiptNumber}`;
                } else if (loss.type === 'EXPENSE') {
                  details = `الوصف: ${loss.details.description}`;
                  if (loss.details.inventory) details += `<br/>المخزن: ${loss.details.inventory}`;
                  if (loss.details.section) details += `<br/>القسم: ${loss.details.section === 'GROCERY' ? 'بقالة' : 'أفران'}`;
                } else if (loss.type === 'SALARY') {
                  details = `الموظف: ${loss.details.employee}<br/>المنصب: ${loss.details.position}<br/>الشهر: ${loss.details.month}/${loss.details.year}`;
                } else if (loss.type === 'ADVANCE') {
                  details = `الموظف: ${loss.details.employee}<br/>المنصب: ${loss.details.position}<br/>السبب: ${loss.details.reason}`;
                }
                if (loss.details.notes) details += `<br/>ملاحظات: ${loss.details.notes}`;
                return `
                  <tr>
                    <td>${loss.typeLabel}</td>
                    <td class="negative">${formatCurrency(parseFloat(loss.amount))}</td>
                    <td>${paymentMethodLabels[loss.method] || loss.method}</td>
                    <td>${new Date(loss.date).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${details || '-'}</td>
                    <td>${loss.recordedBy}</td>
                  </tr>
                `;
              }).join('')}
              ${day.losses.length === 0 ? '<tr><td colspan="6" class="text-center">لا توجد منصرفات</td></tr>' : ''}
            </tbody>
          </table>
        ` : ''}
        
        ${day.transfers && day.transfers.length > 0 ? `
          <h3>التحويلات بين الحسابات (${day.transfers.length} معاملة)</h3>
          <table>
            <thead>
              <tr>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>من → إلى</th>
                <th>التاريخ</th>
                <th>التفاصيل</th>
                <th>سجل بواسطة</th>
              </tr>
            </thead>
            <tbody>
              ${day.transfers.map((transfer: any) => {
                let details = '';
                if (transfer.details.receiptNumber) {
                  details = `رقم الإيصال: ${transfer.details.receiptNumber}`;
                }
                if (transfer.details.notes) {
                  details += details ? ` | ${transfer.details.notes}` : transfer.details.notes;
                }
                return `
                  <tr>
                    <td>${transfer.typeLabel}</td>
                    <td>${formatCurrency(parseFloat(transfer.amount))}</td>
                    <td>${paymentMethodLabels[transfer.fromMethod] || transfer.fromMethod} → ${paymentMethodLabels[transfer.toMethod] || transfer.toMethod}</td>
                    <td>${new Date(transfer.date).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${details || '-'}</td>
                    <td>${transfer.recordedBy}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}
      </div>
    `;
    });

    html += `
      <div class="footer">
        <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-SD')}</p>
      </div>
    `;

    generatePDF(html, 'تقرير_الإيرادات_والمنصرفات');
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-3xl font-bold text-gray-900">تقرير الإيرادات والمنصرفات اليومي</h1>
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          🖨️ طباعة التقرير
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 print:hidden">
        <h2 className="text-xl font-semibold mb-4">مرشحات البحث</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع التقرير</label>
            <select
              value={filters.mode}
              onChange={(e) => setFilters({ ...filters, mode: e.target.value, date: '', startDate: '', endDate: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="single">يوم واحد</option>
              <option value="range">نطاق زمني</option>
            </select>
          </div>

          {filters.mode === 'single' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
            <select
              value={filters.method}
              onChange={(e) => setFilters({ ...filters, method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">الكل</option>
              <option value="CASH">كاش</option>
              <option value="BANK">بنكك</option>
              <option value="BANK_NILE">بنك النيل</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button onClick={loadData} className="w-full">تطبيق</Button>
          </div>
        </div>
      </Card>

      {/* Summary */}
      {reportData?.summary && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">الملخص الإجمالي</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-1">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(parseFloat(reportData.summary.totalIncome))}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.dailyReports.reduce((sum: number, day: any) => sum + day.incomeCount, 0)} معاملة
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600 mb-1">إجمالي المنصرفات</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(parseFloat(reportData.summary.totalLosses))}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.dailyReports.reduce((sum: number, day: any) => sum + day.lossesCount, 0)} معاملة
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${
              parseFloat(reportData.summary.netProfit) >= 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <p className="text-sm text-gray-600 mb-1">صافي الربح/الخسارة</p>
              <p className={`text-2xl font-bold ${
                parseFloat(reportData.summary.netProfit) >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                {formatCurrency(Math.abs(parseFloat(reportData.summary.netProfit)))}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">عدد الأيام</p>
              <p className="text-2xl font-bold text-gray-700">{reportData.summary.totalDays}</p>
            </div>
          </div>
          
          {/* Opening and Closing Balances */}
          {reportData.summary.openingBalance && reportData.summary.closingBalance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">رصيد الافتتاح</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">كاش:</span>
                    <span className="font-semibold text-blue-700">{formatCurrency(parseFloat(reportData.summary.openingBalance.CASH))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">بنكك:</span>
                    <span className="font-semibold text-blue-700">{formatCurrency(parseFloat(reportData.summary.openingBalance.BANK))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">بنك النيل:</span>
                    <span className="font-semibold text-blue-700">{formatCurrency(parseFloat(reportData.summary.openingBalance.BANK_NILE))}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="font-semibold text-gray-800">الإجمالي:</span>
                    <span className="text-xl font-bold text-blue-800">{formatCurrency(parseFloat(reportData.summary.openingBalance.total))}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">رصيد الإقفال</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">كاش:</span>
                    <span className="font-semibold text-purple-700">{formatCurrency(parseFloat(reportData.summary.closingBalance.CASH))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">بنكك:</span>
                    <span className="font-semibold text-purple-700">{formatCurrency(parseFloat(reportData.summary.closingBalance.BANK))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">بنك النيل:</span>
                    <span className="font-semibold text-purple-700">{formatCurrency(parseFloat(reportData.summary.closingBalance.BANK_NILE))}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-purple-200">
                    <span className="font-semibold text-gray-800">الإجمالي:</span>
                    <span className="text-xl font-bold text-purple-800">{formatCurrency(parseFloat(reportData.summary.closingBalance.total))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Daily Reports */}
      {reportData?.dailyReports && reportData.dailyReports.length > 0 ? (
        <div className="space-y-6">
          {reportData.dailyReports.map((day: any, index: number) => (
            <Card key={index}>
              <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {new Date(day.date).toLocaleDateString('ar-SD', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </h3>
                <div className="flex gap-6 mt-2 text-sm text-gray-600">
                  <span className="text-green-600 font-semibold">
                    الإيرادات: {formatCurrency(parseFloat(day.totalIncome))} ({day.incomeCount} معاملة)
                  </span>
                  <span className="text-red-600 font-semibold">
                    المنصرفات: {formatCurrency(parseFloat(day.totalLosses))} ({day.lossesCount} معاملة)
                  </span>
                  <span className={`font-semibold ${
                    parseFloat(day.netProfit) >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    صافي: {formatCurrency(Math.abs(parseFloat(day.netProfit)))}
                  </span>
                </div>
                
                {/* Opening and Closing Balances */}
                {day.openingBalance && day.closingBalance && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-semibold text-blue-800 mb-2">رصيد الافتتاح:</p>
                      <div className="text-xs space-y-1 text-gray-700">
                        <div className="flex justify-between">
                          <span>كاش:</span>
                          <span className="font-semibold">{formatCurrency(parseFloat(day.openingBalance.CASH))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>بنكك:</span>
                          <span className="font-semibold">{formatCurrency(parseFloat(day.openingBalance.BANK))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>بنك النيل:</span>
                          <span className="font-semibold">{formatCurrency(parseFloat(day.openingBalance.BANK_NILE))}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-blue-200">
                          <span className="font-semibold">الإجمالي:</span>
                          <span className="font-bold">{formatCurrency(parseFloat(day.openingBalance.total))}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm font-semibold text-purple-800 mb-2">رصيد الإقفال:</p>
                      <div className="text-xs space-y-1 text-gray-700">
                        <div className="flex justify-between">
                          <span>كاش:</span>
                          <span className="font-semibold">{formatCurrency(parseFloat(day.closingBalance.CASH))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>بنكك:</span>
                          <span className="font-semibold">{formatCurrency(parseFloat(day.closingBalance.BANK))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>بنك النيل:</span>
                          <span className="font-semibold">{formatCurrency(parseFloat(day.closingBalance.BANK_NILE))}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-purple-200">
                          <span className="font-semibold">الإجمالي:</span>
                          <span className="font-bold">{formatCurrency(parseFloat(day.closingBalance.total))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Income Transactions */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-green-700">
                  الإيرادات ({day.income.length})
                </h4>
                {day.income.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">النوع</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">المبلغ</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">طريقة الدفع</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">الوقت</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">التفاصيل</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">سجل بواسطة</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {day.income.map((inc: any) => {
                          let details = '';
                          if (inc.type === 'SALES_PAYMENT') {
                            details = `فاتورة: ${inc.details.invoiceNumber} | العميل: ${inc.details.customer}`;
                            if (inc.details.receiptNumber) details += ` | رقم الإيصال: ${inc.details.receiptNumber}`;
                          }
                          return (
                            <tr key={inc.id}>
                              <td className="px-4 py-2 text-sm">{inc.typeLabel}</td>
                              <td className="px-4 py-2 text-sm font-semibold text-green-700">
                                {formatCurrency(parseFloat(inc.amount))}
                              </td>
                              <td className="px-4 py-2 text-sm">{paymentMethodLabels[inc.method] || inc.method}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {new Date(inc.date).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">{details || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{inc.recordedBy}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">لا توجد إيرادات لهذا اليوم</p>
                )}
              </div>

              {/* Loss Transactions */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-red-700">
                  المنصرفات ({day.losses.length})
                </h4>
                {day.losses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">النوع</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">المبلغ</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">طريقة الدفع</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">الوقت</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">التفاصيل</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">سجل بواسطة</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {day.losses.map((loss: any) => {
                          let details = '';
                          if (loss.type === 'PROCUREMENT_PAYMENT') {
                            details = `أمر: ${loss.details.orderNumber} | المورد: ${loss.details.supplier}`;
                            if (loss.details.receiptNumber) details += ` | رقم الإيصال: ${loss.details.receiptNumber}`;
                          } else if (loss.type === 'EXPENSE') {
                            details = `الوصف: ${loss.details.description}`;
                            if (loss.details.inventory) details += ` | المخزن: ${loss.details.inventory}`;
                          } else if (loss.type === 'SALARY') {
                            details = `الموظف: ${loss.details.employee} | الشهر: ${loss.details.month}/${loss.details.year}`;
                          } else if (loss.type === 'ADVANCE') {
                            details = `الموظف: ${loss.details.employee} | السبب: ${loss.details.reason}`;
                          }
                          return (
                            <tr key={loss.id}>
                              <td className="px-4 py-2 text-sm">{loss.typeLabel}</td>
                              <td className="px-4 py-2 text-sm font-semibold text-red-700">
                                {formatCurrency(parseFloat(loss.amount))}
                              </td>
                              <td className="px-4 py-2 text-sm">{paymentMethodLabels[loss.method] || loss.method}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {new Date(loss.date).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">{details || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{loss.recordedBy}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">لا توجد منصرفات لهذا اليوم</p>
                )}
              </div>

              {/* Cash Transfers */}
              {day.transfers && day.transfers.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium mb-3 text-blue-700">
                    التحويلات بين الحسابات ({day.transfers.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">النوع</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">المبلغ</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">من → إلى</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">الوقت</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">التفاصيل</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">سجل بواسطة</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {day.transfers.map((transfer: any) => {
                          let details = '';
                          if (transfer.details.receiptNumber) {
                            details = `رقم الإيصال: ${transfer.details.receiptNumber}`;
                          }
                          if (transfer.details.notes) {
                            details += details ? ` | ${transfer.details.notes}` : transfer.details.notes;
                          }
                          return (
                            <tr key={transfer.id}>
                              <td className="px-4 py-2 text-sm">{transfer.typeLabel}</td>
                              <td className="px-4 py-2 text-sm font-semibold text-blue-700">
                                {formatCurrency(parseFloat(transfer.amount))}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <span className="text-red-600">
                                  {paymentMethodLabels[transfer.fromMethod] || transfer.fromMethod}
                                </span>
                                {' → '}
                                <span className="text-green-600">
                                  {paymentMethodLabels[transfer.toMethod] || transfer.toMethod}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {new Date(transfer.date).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">{details || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{transfer.recordedBy}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات للفترة المحددة
          </div>
        </Card>
      )}
    </div>
  );
}

