// Enhanced PDF generation utilities for Arabic text support
export function generatePDF(htmlContent: string, filename: string) {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Write the HTML content with proper Arabic font support
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${filename}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Noto Sans Arabic', 'Segoe UI', 'Tahoma', 'Arial Unicode MS', Arial, sans-serif;
          direction: rtl;
          text-align: right;
          line-height: 1.6;
          color: #333;
          background: white;
          padding: 20px;
          font-feature-settings: 'liga' 1, 'calt' 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .header .date {
          font-size: 16px;
          color: #666;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section h2 {
          font-size: 20px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 15px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        
        .section h3 {
          font-size: 18px;
          font-weight: 500;
          color: #34495e;
          margin-bottom: 10px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        table th,
        table td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: right;
        }
        
        table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
        }
        
        table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .summary {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 16px;
        }
        
        .summary-row.total {
          font-weight: 600;
          font-size: 18px;
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        
        .amount {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .positive {
          color: #27ae60;
        }
        
        .negative {
          color: #e74c3c;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 15px;
          }
          
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    // Force a reflow to ensure fonts are applied
    printWindow.document.body.offsetHeight;
    
    // Wait for fonts to load completely
    if (printWindow.document.fonts) {
      printWindow.document.fonts.ready.then(() => {
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      });
    } else {
      setTimeout(() => {
        printWindow.print();
      }, 3000);
    }
  };
}

export function generateBalanceSheetPDF(balanceData: any) {
  const currentDate = new Date().toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const profit = parseFloat(balanceData.sales.received) - 
    (parseFloat(balanceData.procurement.total) + parseFloat(balanceData.expenses.total));

  const htmlContent = `
    <div class="header">
      <h1>الميزانية وقائمة الدخل</h1>
      <div class="date">تاريخ التقرير: ${currentDate}</div>
    </div>

    <div class="section">
      <h2>معلومات التقرير</h2>
      <table>
        <tr>
          <th>تاريخ التقرير</th>
          <td>${currentDate}</td>
          <th>إجمالي المبيعات</th>
          <td>${formatCurrency(balanceData.sales.total)}</td>
        </tr>
        <tr>
          <th>المحصل فعلياً</th>
          <td>${formatCurrency(balanceData.sales.received)}</td>
          <th>المتبقي (ذمم)</th>
          <td>${formatCurrency(balanceData.sales.debt)}</td>
        </tr>
        <tr>
          <th>تكلفة المشتريات</th>
          <td>${formatCurrency(balanceData.procurement.total)}</td>
          <th>المنصرفات</th>
          <td>${formatCurrency(balanceData.expenses.total)}</td>
        </tr>
        <tr>
          <th>الرصيد النقدي</th>
          <td>${formatCurrency(balanceData.balance.net)}</td>
          <th>رأس المال الافتتاحي</th>
          <td>${formatCurrency(balanceData.balance.opening)}</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h2>قائمة الدخل</h2>
      <table>
        <thead>
          <tr>
            <th>البند</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>إجمالي المبيعات</td>
            <td>${formatCurrency(balanceData.sales.total)}</td>
          </tr>
          <tr>
            <td>المحصل فعلياً</td>
            <td>${formatCurrency(balanceData.sales.received)}</td>
          </tr>
          <tr>
            <td>المتبقي (ذمم)</td>
            <td>${formatCurrency(balanceData.sales.debt)}</td>
          </tr>
          <tr>
            <td>تكلفة المشتريات</td>
            <td>${formatCurrency(balanceData.procurement.total)}</td>
          </tr>
          <tr>
            <td>المنصرفات</td>
            <td>${formatCurrency(balanceData.expenses.total)}</td>
          </tr>
          <tr>
            <td>إجمالي التكاليف</td>
            <td>${formatCurrency(parseFloat(balanceData.procurement.total) + parseFloat(balanceData.expenses.total))}</td>
          </tr>
          <tr>
            <td><strong>${profit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}</strong></td>
            <td><strong>${formatCurrency(Math.abs(profit))}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>الميزانية</h2>
      <table>
        <thead>
          <tr>
            <th>البند</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>الرصيد الصافي (نقد)</td>
            <td>${formatCurrency(balanceData.balance.net)}</td>
          </tr>
          <tr>
            <td>ذمم مدينة (عملاء)</td>
            <td>${formatCurrency(balanceData.sales.debt)}</td>
          </tr>
          <tr>
            <td><strong>إجمالي الأصول</strong></td>
            <td><strong>${formatCurrency(parseFloat(balanceData.balance.net) + parseFloat(balanceData.sales.debt))}</strong></td>
          </tr>
          <tr>
            <td>رأس المال الافتتاحي</td>
            <td>${formatCurrency(balanceData.balance.opening)}</td>
          </tr>
          <tr>
            <td>${profit >= 0 ? 'الأرباح المحتجزة' : 'الخسائر المتراكمة'}</td>
            <td>${formatCurrency(Math.abs(profit))}</td>
          </tr>
          <tr>
            <td><strong>إجمالي حقوق الملكية</strong></td>
            <td><strong>${formatCurrency(parseFloat(balanceData.balance.opening) + profit)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-SD')}</p>
    </div>
  `;

  generatePDF(htmlContent, 'الميزانية وقائمة الدخل');
}

export function generateInvoicePDF(invoice: any) {
  const currentDate = new Date().toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const remainingAmount = parseFloat(invoice.total) - parseFloat(invoice.paidAmount);

  const htmlContent = `
    <div class="header">
      <h1>فاتورة مبيعات</h1>
      <div class="date">رقم الفاتورة: ${invoice.invoiceNumber} | التاريخ: ${currentDate}</div>
    </div>

    <div class="section">
      <h2>معلومات الفاتورة</h2>
      <table>
        <tr>
          <th>العميل</th>
          <td>${invoice.customer.name}</td>
          <th>المخزن</th>
          <td>${invoice.inventory.name}</td>
        </tr>
        <tr>
          <th>القسم</th>
          <td>${invoice.section === 'GROCERY' ? 'بقالة' : 'أفران'}</td>
          <th>طريقة الدفع</th>
          <td>${invoice.paymentMethod === 'CASH' ? 'كاش' : invoice.paymentMethod === 'BANK' ? 'بنكك' : 'بنك النيل'}</td>
        </tr>
        <tr>
          <th>حالة الدفع</th>
          <td>${invoice.paymentStatus === 'PAID' ? 'مدفوعة' : invoice.paymentStatus === 'PARTIAL' ? 'مدفوعة جزئياً' : 'دفع آجل'}</td>
          <th>حالة التسليم</th>
          <td>${invoice.deliveryStatus === 'DELIVERED' ? 'مُسلَّمة' : 'غير مُسلَّمة'}</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h2>أصناف الفاتورة</h2>
      <table>
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الكمية</th>
            <th>الكمية المجانية</th>
            <th>السعر</th>
            <th>المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item: any) => `
            <tr>
              <td>${item.item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.giftQty}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.lineTotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>ملخص الفاتورة</h2>
      <div class="summary">
        <div class="summary-row">
          <span>المجموع الفرعي:</span>
          <span class="amount">${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>الخصم:</span>
          <span class="amount">${formatCurrency(invoice.discount)}</span>
        </div>
        <div class="summary-row total">
          <span>المجموع الكلي:</span>
          <span class="amount">${formatCurrency(invoice.total)}</span>
        </div>
        <div class="summary-row">
          <span>المدفوع:</span>
          <span class="amount">${formatCurrency(invoice.paidAmount)}</span>
        </div>
        <div class="summary-row total">
          <span>المتبقي:</span>
          <span class="amount ${remainingAmount > 0 ? 'negative' : 'positive'}">${formatCurrency(remainingAmount)}</span>
        </div>
      </div>
    </div>

    ${invoice.payments && invoice.payments.length > 0 ? `
    <div class="section">
      <h2>الدفعات</h2>
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>المبلغ</th>
            <th>طريقة الدفع</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.payments.map((payment: any) => `
            <tr>
              <td>${new Date(payment.paidAt).toLocaleDateString('ar-SD')}</td>
              <td>${formatCurrency(payment.amount)}</td>
              <td>${payment.method === 'CASH' ? 'كاش' : payment.method === 'BANK' ? 'بنكك' : 'بنك النيل'}</td>
              <td>${payment.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${invoice.notes ? `
    <div class="section">
      <h2>ملاحظات</h2>
      <p>${invoice.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>تم إنشاء هذه الفاتورة في ${new Date().toLocaleString('ar-SD')}</p>
    </div>
  `;

  generatePDF(htmlContent, `فاتورة_${invoice.invoiceNumber}`);
}

// Generate invoice PDF for accountant - prints twice on one A4 page
export function generateInvoicePDFForAccountant(invoice: any) {
  const currentDate = new Date().toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const remainingAmount = parseFloat(invoice.total) - parseFloat(invoice.paidAmount);

  // Helper function to generate invoice content
  const generateInvoiceContent = () => {
    return `
      <div class="invoice-duplicate">
        <div class="header">
          <h1>فاتورة مبيعات</h1>
          <div class="date">رقم الفاتورة: ${invoice.invoiceNumber} | التاريخ: ${currentDate}</div>
        </div>

        <div class="section">
          <h2>معلومات الفاتورة</h2>
          <table>
            <tr>
              <th>العميل</th>
              <td>${invoice.customer?.name || 'بدون عميل'}</td>
              <th>المخزن</th>
              <td>${invoice.inventory.name}</td>
            </tr>
            <tr>
              <th>القسم</th>
              <td>${invoice.section === 'GROCERY' ? 'بقالة' : 'أفران'}</td>
              <th>طريقة الدفع</th>
              <td>${invoice.paymentMethod === 'CASH' ? 'كاش' : invoice.paymentMethod === 'BANK' ? 'بنكك' : 'بنك النيل'}</td>
            </tr>
            <tr>
              <th>حالة الدفع</th>
              <td>${invoice.paymentStatus === 'PAID' ? 'مدفوعة' : invoice.paymentStatus === 'PARTIAL' ? 'مدفوعة جزئياً' : 'دفع آجل'}</td>
              <th>حالة التسليم</th>
              <td>${invoice.deliveryStatus === 'DELIVERED' ? 'مُسلَّمة' : 'غير مُسلَّمة'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>أصناف الفاتورة</h2>
          <table>
            <thead>
              <tr>
                <th>الصنف</th>
                <th>الكمية</th>
                <th>الكمية المجانية</th>
                <th>السعر</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: any) => `
                <tr>
                  <td>${item.item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.giftQty || 0}</td>
                  <td>${formatCurrency(item.unitPrice)}</td>
                  <td>${formatCurrency(item.lineTotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>ملخص الفاتورة</h2>
          <div class="summary">
            <div class="summary-row">
              <span>المجموع الفرعي:</span>
              <span class="amount">${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>الخصم:</span>
              <span class="amount">${formatCurrency(invoice.discount)}</span>
            </div>
            <div class="summary-row total">
              <span>المجموع الكلي:</span>
              <span class="amount">${formatCurrency(invoice.total)}</span>
            </div>
            <div class="summary-row">
              <span>المدفوع:</span>
              <span class="amount">${formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div class="summary-row total">
              <span>المتبقي:</span>
              <span class="amount ${remainingAmount > 0 ? 'negative' : 'positive'}">${formatCurrency(remainingAmount)}</span>
            </div>
          </div>
        </div>

        ${invoice.payments && invoice.payments.length > 0 ? `
        <div class="section">
          <h2>الدفعات</h2>
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>طريقة الدفع</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.payments.map((payment: any) => `
                <tr>
                  <td>${new Date(payment.paidAt).toLocaleDateString('ar-SD')}</td>
                  <td>${formatCurrency(payment.amount)}</td>
                  <td>${payment.method === 'CASH' ? 'كاش' : payment.method === 'BANK' ? 'بنكك' : 'بنك النيل'}</td>
                  <td>${payment.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${invoice.notes ? `
        <div class="section">
          <h2>ملاحظات</h2>
          <p>${invoice.notes}</p>
        </div>
        ` : ''}
      </div>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة_${invoice.invoiceNumber}_محاسب</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 10mm;
        }
        
        body {
          font-family: 'Noto Sans Arabic', 'Segoe UI', 'Tahoma', 'Arial Unicode MS', Arial, sans-serif;
          direction: rtl;
          text-align: right;
          line-height: 1.4;
          color: #333;
          background: white;
          font-feature-settings: 'liga' 1, 'calt' 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .invoice-duplicate {
          width: 100%;
          page-break-inside: avoid;
          margin-bottom: 20px;
          border: 1px solid #ddd;
          padding: 15px;
          box-sizing: border-box;
        }
        
        .invoice-duplicate:last-child {
          margin-bottom: 0;
        }
        
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        
        .header h1 {
          font-size: 22px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        
        .header .date {
          font-size: 14px;
          color: #666;
        }
        
        .section {
          margin-bottom: 15px;
        }
        
        .section h2 {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 8px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 3px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 12px;
        }
        
        table th,
        table td {
          border: 1px solid #ddd;
          padding: 6px 8px;
          text-align: right;
        }
        
        table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
        }
        
        table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .summary {
          background-color: #f8f9fa;
          padding: 12px;
          border-radius: 4px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 13px;
        }
        
        .summary-row.total {
          font-weight: 700;
          font-size: 14px;
          border-top: 1px solid #ddd;
          padding-top: 6px;
          margin-top: 6px;
        }
        
        .summary-row .amount {
          font-weight: 600;
        }
        
        .summary-row .amount.negative {
          color: #dc3545;
        }
        
        .summary-row .amount.positive {
          color: #28a745;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .invoice-duplicate {
            page-break-inside: avoid;
            margin-bottom: 15mm;
          }
          
          .invoice-duplicate:last-child {
            margin-bottom: 0;
          }
        }
      </style>
    </head>
    <body>
      ${generateInvoiceContent()}
      ${generateInvoiceContent()}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for fonts to load before printing
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

export function generateProcOrderPDF(order: any) {
  const currentDate = new Date().toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = `
    <div class="header">
      <h1>أمر شراء</h1>
      <div class="date">رقم الأمر: ${order.orderNumber} | التاريخ: ${currentDate}</div>
    </div>

    <div class="section">
      <h2>معلومات الأمر</h2>
      <table>
        <tr>
          <th>المورد</th>
          <td>${order.supplier.name}</td>
          <th>المخزن</th>
          <td>${order.inventory.name}</td>
        </tr>
        <tr>
          <th>القسم</th>
          <td>${order.section === 'GROCERY' ? 'بقالة' : 'أفران'}</td>
          <th>الحالة</th>
          <td>${order.status === 'CREATED' ? 'جديد' : order.status === 'RECEIVED' ? 'مستلم' : order.status === 'PARTIAL' ? 'مستلم جزئياً' : 'ملغي'}</td>
        </tr>
        <tr>
          <th>تاريخ الإنشاء</th>
          <td>${new Date(order.createdAt).toLocaleDateString('ar-SD')}</td>
          <th>تم إنشاؤه بواسطة</th>
          <td>${order.creator.username}</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h2>أصناف الأمر</h2>
      <table>
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item: any) => `
            <tr>
              <td>${item.item.name}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unitCost)}</td>
              <td>${formatCurrency(item.lineTotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>ملخص الأمر</h2>
      <div class="summary">
        <div class="summary-row total">
          <span>إجمالي الأمر:</span>
          <span class="amount">${formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>

    ${order.notes ? `
    <div class="section">
      <h2>ملاحظات</h2>
      <p>${order.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>تم إنشاء هذا الأمر في ${new Date().toLocaleString('ar-SD')}</p>
    </div>
  `;

  generatePDF(htmlContent, `أمر_شراء_${order.orderNumber}`);
}

export function generateLiquidCashPDF(liquidData: any) {
  const currentDate = new Date().toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = `
    <div class="header">
      <h1>التقرير النقدي السائل</h1>
      <div class="date">تاريخ التقرير: ${currentDate}</div>
    </div>

    <div class="section">
      <h2>ملخص السيولة النقدية</h2>
      
      <div class="summary">
        <div class="summary-row">
          <span>النقدية (كاش):</span>
          <span class="amount positive">${formatCurrency(liquidData.net.cash)}</span>
        </div>
        <div class="summary-row">
          <span>بنكك:</span>
          <span class="amount positive">${formatCurrency(liquidData.net.bank)}</span>
        </div>
        <div class="summary-row">
          <span>بنك النيل:</span>
          <span class="amount positive">${formatCurrency(liquidData.net.bankNile)}</span>
        </div>
        <div class="summary-row total">
          <span>إجمالي السيولة النقدية:</span>
          <span class="amount positive">${formatCurrency(liquidData.net.total)}</span>
        </div>
      </div>
    </div>

    ${liquidData.debts ? `
    <div class="section">
      <h2>ملخص الديون</h2>
      
      <div class="summary">
        <div class="summary-row">
          <span>الديون الواردة (لنا):</span>
          <span class="amount positive">${formatCurrency(liquidData.debts.inbound.total)}</span>
        </div>
        <div class="summary-row">
          <span>الديون الصادرة (علينا):</span>
          <span class="amount negative">${formatCurrency(liquidData.debts.outbound.total)}</span>
        </div>
        <div class="summary-row total">
          <span>صافي الديون:</span>
          <span class="amount ${parseFloat(liquidData.debts.net) >= 0 ? 'positive' : 'negative'}">${formatCurrency(liquidData.debts.net)}</span>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h2>تفصيل الإيرادات حسب طريقة الدفع</h2>
      
      <table>
        <thead>
          <tr>
            <th>طريقة الدفع</th>
            <th>إجمالي الإيرادات</th>
            <th>عدد الدفعات</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>النقدية (كاش)</td>
            <td>${formatCurrency(liquidData.payments.cash.total)}</td>
            <td>${liquidData.payments.cash.count} دفعة</td>
          </tr>
          <tr>
            <td>بنكك</td>
            <td>${formatCurrency(liquidData.payments.bank.total)}</td>
            <td>${liquidData.payments.bank.count} دفعة</td>
          </tr>
          <tr>
            <td>بنك النيل</td>
            <td>${formatCurrency(liquidData.payments.bankNile.total)}</td>
            <td>${liquidData.payments.bankNile.count} دفعة</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>تفصيل المنصرفات حسب طريقة الدفع</h2>
      
      <table>
        <thead>
          <tr>
            <th>طريقة الدفع</th>
            <th>إجمالي المنصرفات</th>
            <th>عدد المنصرفات</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>النقدية (كاش)</td>
            <td>${formatCurrency(liquidData.expenses.cash.total)}</td>
            <td>${liquidData.expenses.cash.count} منصرف</td>
          </tr>
          <tr>
            <td>بنكك</td>
            <td>${formatCurrency(liquidData.expenses.bank.total)}</td>
            <td>${liquidData.expenses.bank.count} منصرف</td>
          </tr>
          <tr>
            <td>بنك النيل</td>
            <td>${formatCurrency(liquidData.expenses.bankNile.total)}</td>
            <td>${liquidData.expenses.bankNile.count} منصرف</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>صافي السيولة النقدية</h2>
      
      <div class="summary">
        <div class="summary-row">
          <span>صافي النقدية (كاش):</span>
          <span class="amount ${parseFloat(liquidData.net.cash) >= 0 ? 'positive' : 'negative'}">${formatCurrency(liquidData.net.cash)}</span>
        </div>
        <div class="summary-row">
          <span>صافي بنكك:</span>
          <span class="amount ${parseFloat(liquidData.net.bank) >= 0 ? 'positive' : 'negative'}">${formatCurrency(liquidData.net.bank)}</span>
        </div>
        <div class="summary-row">
          <span>صافي بنك النيل:</span>
          <span class="amount ${parseFloat(liquidData.net.bankNile) >= 0 ? 'positive' : 'negative'}">${formatCurrency(liquidData.net.bankNile)}</span>
        </div>
        <div class="summary-row total">
          <span>إجمالي السيولة النقدية:</span>
          <span class="amount ${parseFloat(liquidData.net.total) >= 0 ? 'positive' : 'negative'}">${formatCurrency(liquidData.net.total)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-SD')}</p>
    </div>
  `;

  generatePDF(htmlContent, 'التقرير النقدي السائل');
}

export function generateDailyReportPDF(reportData: any) {
  const currentDate = new Date(reportData.date).toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = `
    <div class="header">
      <h1>التقرير اليومي</h1>
      <div class="date">تاريخ التقرير: ${currentDate}</div>
    </div>

    <div class="section">
      <h2>ملخص المبيعات</h2>
      <table>
        <thead>
          <tr>
            <th>البند</th>
            <th>العدد</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>عدد الفواتير</td>
            <td>${reportData.sales.invoices}</td>
            <td>-</td>
          </tr>
          <tr>
            <td>إجمالي المبيعات</td>
            <td>-</td>
            <td>${formatCurrency(reportData.sales.total)}</td>
          </tr>
          <tr>
            <td>المحصل فعلياً</td>
            <td>-</td>
            <td class="positive">${formatCurrency(reportData.sales.received)}</td>
          </tr>
          <tr>
            <td>المتبقي (ذمم)</td>
            <td>-</td>
            <td class="negative">${formatCurrency(reportData.sales.pending)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>ملخص المشتريات</h2>
      <table>
        <thead>
          <tr>
            <th>البند</th>
            <th>العدد</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>عدد أوامر الشراء</td>
            <td>${reportData.procurement.orders}</td>
            <td>-</td>
          </tr>
          <tr>
            <td>إجمالي المشتريات</td>
            <td>-</td>
            <td>${formatCurrency(reportData.procurement.total)}</td>
          </tr>
          <tr>
            <td>المدفوع</td>
            <td>-</td>
            <td class="negative">${formatCurrency(reportData.procurement.paid)}</td>
          </tr>
          <tr>
            <td>المتبقي</td>
            <td>-</td>
            <td class="negative">${formatCurrency(reportData.procurement.pending)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>ملخص المنصرفات</h2>
      <table>
        <thead>
          <tr>
            <th>البند</th>
            <th>العدد</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>عدد المنصرفات</td>
            <td>${reportData.expenses.count}</td>
            <td>-</td>
          </tr>
          <tr>
            <td>إجمالي المنصرفات</td>
            <td>-</td>
            <td class="negative">${formatCurrency(reportData.expenses.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>الملخص المالي</h2>
      <div class="summary">
        <div class="summary-row">
          <span>إجمالي الإيرادات:</span>
          <span class="amount positive">${formatCurrency(reportData.summary.totalRevenue)}</span>
        </div>
        <div class="summary-row">
          <span>إجمالي التكاليف:</span>
          <span class="amount negative">${formatCurrency(reportData.summary.totalCosts)}</span>
        </div>
        <div class="summary-row total">
          <span>صافي التدفق النقدي:</span>
          <span class="amount ${parseFloat(reportData.summary.netCashFlow) >= 0 ? 'positive' : 'negative'}">${formatCurrency(reportData.summary.netCashFlow)}</span>
        </div>
      </div>
    </div>

    ${reportData.sales.invoices > 0 ? `
    <div class="section">
      <h2>تفاصيل فواتير المبيعات</h2>
      <table>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>العميل</th>
            <th>المجموع</th>
            <th>المدفوع</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.sales.invoiceList.map((invoice: any) => `
            <tr>
              <td>${invoice.number}</td>
              <td>${invoice.customer}</td>
              <td>${formatCurrency(invoice.total)}</td>
              <td>${formatCurrency(invoice.paid)}</td>
              <td>${invoice.status === 'PAID' ? 'مدفوعة' : invoice.status === 'PARTIAL' ? 'جزئية' : 'آجلة'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${reportData.procurement.orders > 0 ? `
    <div class="section">
      <h2>تفاصيل أوامر الشراء</h2>
      <table>
        <thead>
          <tr>
            <th>رقم الأمر</th>
            <th>المورد</th>
            <th>المجموع</th>
            <th>المدفوع</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.procurement.orderList.map((order: any) => `
            <tr>
              <td>${order.number}</td>
              <td>${order.supplier}</td>
              <td>${formatCurrency(order.total)}</td>
              <td>${formatCurrency(order.paid)}</td>
              <td>${order.status === 'CONFIRMED' ? 'مؤكد' : 'في الانتظار'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${reportData.expenses.count > 0 ? `
    <div class="section">
      <h2>تفاصيل المنصرفات</h2>
      <table>
        <thead>
          <tr>
            <th>الوصف</th>
            <th>المبلغ</th>
            <th>طريقة الدفع</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.expenses.items.map((expense: any) => `
            <tr>
              <td>${expense.description}</td>
              <td>${formatCurrency(expense.amount)}</td>
              <td>${expense.method === 'CASH' ? 'نقدي' : expense.method === 'BANK' ? 'بنكك' : 'بنك النيل'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-SD')}</p>
    </div>
  `;

  generatePDF(htmlContent, `التقرير_اليومي_${reportData.date}`);
}

export function generateCustomerReportPDF(customer: any) {
  const currentDate = new Date().toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get all items from all invoices with payment method info
  const allItems: any[] = [];
  const paymentMethodLabels: any = {
    'CASH': 'كاش',
    'BANK': 'بنكك',
    'BANK_NILE': 'بنك النيل'
  };

  customer.salesInvoices?.forEach((invoice: any) => {
    invoice.items?.forEach((invoiceItem: any) => {
      // Determine payment method - if invoice has multiple payment methods, mark as "متعدد"
      let paymentMethod = paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod;
      
      // Check if invoice has multiple payments with different methods
      if (invoice.payments && invoice.payments.length > 1) {
        const uniqueMethods = new Set(invoice.payments.map((p: any) => p.method));
        if (uniqueMethods.size > 1) {
          paymentMethod = 'متعدد';
        } else if (invoice.payments.length > 0) {
          paymentMethod = paymentMethodLabels[invoice.payments[0].method] || invoice.payments[0].method;
        }
      } else if (invoice.payments && invoice.payments.length === 1) {
        paymentMethod = paymentMethodLabels[invoice.payments[0].method] || invoice.payments[0].method;
      }

      allItems.push({
        itemName: invoiceItem.item.name,
        quantity: invoiceItem.quantity,
        unitPrice: invoiceItem.unitPrice,
        lineTotal: invoiceItem.lineTotal,
        paymentMethod: paymentMethod,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.createdAt
      });
    });
  });

  // Calculate totals
  const totalSales = customer.salesInvoices?.reduce((sum: number, inv: any) => 
    sum + parseFloat(inv.total), 0) || 0;
  
  const totalPaid = customer.salesInvoices?.reduce((sum: number, inv: any) => 
    sum + parseFloat(inv.paidAmount), 0) || 0;

  const outstandingBalance = totalSales - totalPaid;

  const htmlContent = `
    <div class="header">
      <h1>تقرير العميل</h1>
      <div class="date">اسم العميل: ${customer.name} | تاريخ التقرير: ${currentDate}</div>
    </div>

    <div class="section">
      <h2>معلومات العميل</h2>
      <table>
        <tr>
          <th>الاسم</th>
          <td>${customer.name}</td>
          <th>النوع</th>
          <td>${customer.type === 'WHOLESALE' ? 'جملة' : 'مفرق'}</td>
        </tr>
        <tr>
          <th>القسم</th>
          <td>${customer.division === 'GROCERY' ? 'بقالة' : 'أفران'}</td>
          ${customer.phone ? `<th>رقم الهاتف</th><td>${customer.phone}</td>` : ''}
        </tr>
        ${customer.address ? `
        <tr>
          <th>العنوان</th>
          <td colspan="3">${customer.address}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div class="section">
      <h2>الملخص المالي</h2>
      <div class="summary">
        <div class="summary-row">
          <span>إجمالي المبيعات:</span>
          <span class="amount">${formatCurrency(totalSales)}</span>
        </div>
        <div class="summary-row">
          <span>المدفوع:</span>
          <span class="amount positive">${formatCurrency(totalPaid)}</span>
        </div>
        <div class="summary-row total">
          <span>المتبقي (ذمم مدينة):</span>
          <span class="amount ${outstandingBalance > 0 ? 'negative' : 'positive'}">${formatCurrency(outstandingBalance)}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>تفاصيل الأصناف المباعة</h2>
      <table>
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الكمية</th>
            <th>السعر</th>
            <th>المبلغ</th>
            <th>طريقة الدفع</th>
          </tr>
        </thead>
        <tbody>
          ${allItems.map((item: any) => `
            <tr>
              <td>${item.itemName}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.lineTotal)}</td>
              <td>${item.paymentMethod}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${customer.salesInvoices && customer.salesInvoices.length > 0 ? `
    <div class="section">
      <h2>ملخص الفواتير</h2>
      <table>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>التاريخ</th>
            <th>المجموع</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>حالة الدفع</th>
          </tr>
        </thead>
        <tbody>
          ${customer.salesInvoices.map((invoice: any) => {
            const remaining = parseFloat(invoice.total) - parseFloat(invoice.paidAmount);
            return `
            <tr>
              <td>${invoice.invoiceNumber}</td>
              <td>${new Date(invoice.createdAt).toLocaleDateString('ar-SD')}</td>
              <td>${formatCurrency(invoice.total)}</td>
              <td>${formatCurrency(invoice.paidAmount)}</td>
              <td class="${remaining > 0 ? 'negative' : ''}">${formatCurrency(remaining)}</td>
              <td>${invoice.paymentStatus === 'PAID' ? 'مدفوعة' : invoice.paymentStatus === 'PARTIAL' ? 'جزئية' : 'آجلة'}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-SD')}</p>
    </div>
  `;

  generatePDF(htmlContent, `تقرير_${customer.name}`);
}

export function generateSalesReportPDF(reportData: any, filters: any) {
  if (!reportData || !reportData.data || reportData.data.length === 0) {
    alert('لا توجد بيانات للطباعة');
    return;
  }

  const currentDate = new Date().toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const dateLabel = filters.date 
    ? new Date(filters.date).toLocaleDateString('ar-SD', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'لم يتم تحديد التاريخ';

  // Check if this is an items report (stock movements)
  const isItemsReport = reportData.data[0]?.itemName !== undefined;
  
  let htmlContent = `
    <div class="header">
      <h1>تقرير المبيعات</h1>
      <div class="date">تاريخ التقرير: ${currentDate} | التاريخ: ${dateLabel}</div>
    </div>

    ${reportData.summary ? `
    <div class="section">
      <h2>ملخص التقرير</h2>
      <table>
        <thead>
          <tr>
            <th>البند</th>
            <th>القيمة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>إجمالي الفواتير</td>
            <td>${reportData.summary.totalInvoices}</td>
          </tr>
          <tr>
            <td>إجمالي المبيعات</td>
            <td>${formatCurrency(reportData.summary.totalSales)}</td>
          </tr>
          <tr>
            <td>المحصل</td>
            <td class="positive">${formatCurrency(reportData.summary.totalPaid)}</td>
          </tr>
          <tr>
            <td>المتبقي (ذمم)</td>
            <td class="negative">${formatCurrency(reportData.summary.totalOutstanding)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
  `;

  // Handle items report (stock movements)
  if (isItemsReport) {
    htmlContent += `
      <div class="section">
        <h2>حركة المخزون</h2>
        <table>
          <thead>
            <tr>
              <th>ترقيم</th>
              <th>الصنف</th>
              <th>رصيد افتتاحي</th>
              <th>منصرف</th>
              <th>هدية منصرف</th>
              <th>وارد</th>
              <th>هدية وارد</th>
              <th>رصيد ختامي</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.data.map((item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.itemName}</td>
                <td>${item.openingBalance}</td>
                <td>${item.outgoing}</td>
                <td>${item.outgoingGifts}</td>
                <td>${item.incoming}</td>
                <td>${item.incomingGifts}</td>
                <td>${item.closingBalance}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    // Handle grouped/invoice reports
    reportData.data.forEach((periodData: any) => {
      const periodTitle = periodData.date 
        ? formatDate(periodData.date)
        : 'فترة غير محددة';

    htmlContent += `
      <div class="section">
        <h2>الفترة: ${periodTitle}</h2>
        
        <div class="summary">
          <div class="summary-row">
            <span>عدد الفواتير:</span>
            <span>${periodData.invoiceCount}</span>
          </div>
          <div class="summary-row">
            <span>إجمالي المبيعات:</span>
            <span class="amount">${formatCurrency(periodData.totalSales)}</span>
          </div>
          <div class="summary-row">
            <span>المحصل:</span>
            <span class="amount positive">${formatCurrency(periodData.totalPaid)}</span>
          </div>
        </div>

        ${Object.keys(periodData.paymentMethods).length > 0 ? `
        <h3>طرق الدفع</h3>
        <table>
          <thead>
            <tr>
              <th>طريقة الدفع</th>
              <th>عدد الفواتير</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(periodData.paymentMethods).map(([method, data]: [string, any]) => `
              <tr>
                <td>${method === 'CASH' ? 'كاش' : method === 'BANK' ? 'بنكك' : 'بنك النيل'}</td>
                <td>${data.count}</td>
                <td>${formatCurrency(data.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${Object.keys(periodData.items).length > 0 ? `
        <h3>الأصناف المباعة</h3>
        <table>
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>سعر الوحدة</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(periodData.items).map(([itemName, itemData]: [string, any]) => `
              <tr>
                <td>${itemName}</td>
                <td>${itemData.quantity}</td>
                <td>${formatCurrency(itemData.unitPrice)}</td>
                <td>${formatCurrency(itemData.totalAmount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${periodData.invoices && periodData.invoices.length > 0 ? `
        <h3>تفاصيل الفواتير</h3>
        <table>
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>العميل</th>
              <th>المخزن</th>
              <th>طريقة الدفع</th>
              <th>المجموع</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${periodData.invoices.map((invoice: any) => `
              <tr>
                <td>${invoice.invoiceNumber}</td>
                <td>${invoice.customer?.name || 'بدون عميل'}</td>
                <td>${invoice.inventory?.name || 'غير محدد'}</td>
                <td>${invoice.paymentMethod === 'CASH' ? 'كاش' : invoice.paymentMethod === 'BANK' ? 'بنكك' : 'بنك النيل'}</td>
                <td>${formatCurrency(invoice.total)}</td>
                <td>${formatDate(invoice.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
      </div>
    `;
    });
  }

  htmlContent += `
    <div class="footer">
      <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-SD')}</p>
    </div>
  `;

  generatePDF(htmlContent, 'تقرير_المبيعات');
}

export function printProcurementReport(reportData: any, filters: any) {
  if (!reportData || !reportData.data || reportData.data.length === 0) {
    alert('لا توجد بيانات للطباعة');
    return;
  }

  const currentDate = new Date().toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const periodLabel = filters.period === 'monthly' ? 'شهري' : 'يومي';
  const dateRange = filters.startDate && filters.endDate 
    ? `${filters.startDate} - ${filters.endDate}`
    : 'جميع التواريخ';

  let htmlContent = `
    <div class="header">
      <h1>تقرير المشتريات ${periodLabel}</h1>
      <div class="date">تاريخ التقرير: ${currentDate} | الفترة: ${dateRange}</div>
    </div>

    <div class="section">
      <h2>ملخص التقرير</h2>
      <table>
        <thead>
          <tr>
            <th>البند</th>
            <th>القيمة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>إجمالي الأوامر</td>
            <td>${reportData.summary.totalOrders}</td>
          </tr>
          <tr>
            <td>إجمالي المشتريات</td>
            <td class="negative">${formatCurrency(reportData.summary.totalAmount)}</td>
          </tr>
          <tr>
            <td>أوامر مدفوعة</td>
            <td class="positive">${reportData.summary.paidOrders}</td>
          </tr>
          <tr>
            <td>أوامر غير مدفوعة</td>
            <td class="negative">${reportData.summary.unpaidOrders}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  reportData.data.forEach((periodData: any) => {
    const periodTitle = filters.period === 'daily' 
      ? formatDate(periodData.date)
      : periodData.month;

    htmlContent += `
      <div class="section">
        <h2>الفترة: ${periodTitle}</h2>
        
        <div class="summary">
          <div class="summary-row">
            <span>عدد الأوامر:</span>
            <span>${periodData.orderCount}</span>
          </div>
          <div class="summary-row">
            <span>إجمالي المشتريات:</span>
            <span class="amount negative">${formatCurrency(periodData.totalAmount)}</span>
          </div>
        </div>

        ${Object.keys(periodData.statuses).length > 0 ? `
        <h3>حالات الأوامر</h3>
        <table>
          <thead>
            <tr>
              <th>الحالة</th>
              <th>عدد الأوامر</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(periodData.statuses).map(([status, data]: [string, any]) => `
              <tr>
                <td>${status === 'CREATED' ? 'جديد' : status === 'RECEIVED' ? 'مستلم' : status === 'PARTIAL' ? 'مستلم جزئياً' : 'ملغي'}</td>
                <td>${data.count}</td>
                <td>${formatCurrency(data.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${Object.keys(periodData.suppliers).length > 0 ? `
        <h3>الموردين</h3>
        <table>
          <thead>
            <tr>
              <th>المورد</th>
              <th>عدد الأوامر</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(periodData.suppliers).map(([supplierName, data]: [string, any]) => `
              <tr>
                <td>${supplierName}</td>
                <td>${data.count}</td>
                <td>${formatCurrency(data.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${Object.keys(periodData.items).length > 0 ? `
        <h3>الأصناف المشتراة</h3>
        <table>
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>تكلفة الوحدة</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(periodData.items).map(([itemName, itemData]: [string, any]) => `
              <tr>
                <td>${itemName}</td>
                <td>${itemData.quantity}</td>
                <td>${formatCurrency(itemData.unitCost)}</td>
                <td>${formatCurrency(itemData.totalAmount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${periodData.orders && periodData.orders.length > 0 ? `
        <h3>تفاصيل الأوامر</h3>
        <table>
          <thead>
            <tr>
              <th>رقم الأمر</th>
              <th>المورد</th>
              <th>المخزن</th>
              <th>الحالة</th>
              <th>الدفع</th>
              <th>المجموع</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${periodData.orders.map((order: any) => `
              <tr>
                <td>${order.orderNumber}</td>
                <td>${order.supplier.name}</td>
                <td>${order.inventory.name}</td>
                <td>${order.status === 'CREATED' ? 'جديد' : order.status === 'RECEIVED' ? 'مستلم' : order.status === 'PARTIAL' ? 'مستلم جزئياً' : 'ملغي'}</td>
                <td>${order.paymentConfirmed ? '✓ مؤكد' : '⏳ معلق'}</td>
                <td>${formatCurrency(order.total)}</td>
                <td>${formatDate(order.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
      </div>
    `;
  });

  htmlContent += `
    <div class="footer">
      <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-SD')}</p>
    </div>
  `;

  generatePDF(htmlContent, 'تقرير_المشتريات');
}

// Helper function to format currency
function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SDG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
