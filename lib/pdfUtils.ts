// PDF generation utilities for Arabic text support
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
          font-family: 'Noto Sans Arabic', Arial, sans-serif;
          direction: rtl;
          text-align: right;
          line-height: 1.6;
          color: #333;
          background: white;
          padding: 20px;
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
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
      <h2>قائمة الدخل</h2>
      
      <h3>الإيرادات</h3>
      <div class="summary">
        <div class="summary-row">
          <span>إجمالي المبيعات:</span>
          <span class="amount">${formatCurrency(balanceData.sales.total)}</span>
        </div>
        <div class="summary-row">
          <span>المحصل فعلياً:</span>
          <span class="amount positive">${formatCurrency(balanceData.sales.received)}</span>
        </div>
        <div class="summary-row">
          <span>المتبقي (ذمم):</span>
          <span class="amount">${formatCurrency(balanceData.sales.debt)}</span>
        </div>
      </div>

      <h3>التكاليف</h3>
      <div class="summary">
        <div class="summary-row">
          <span>تكلفة المشتريات:</span>
          <span class="amount">${formatCurrency(balanceData.procurement.total)}</span>
        </div>
        <div class="summary-row">
          <span>المنصرفات:</span>
          <span class="amount">${formatCurrency(balanceData.expenses.total)}</span>
        </div>
        <div class="summary-row total">
          <span>إجمالي التكاليف:</span>
          <span class="amount">${formatCurrency(parseFloat(balanceData.procurement.total) + parseFloat(balanceData.expenses.total))}</span>
        </div>
      </div>

      <div class="summary">
        <div class="summary-row total">
          <span>${profit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}:</span>
          <span class="amount ${profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(Math.abs(profit))}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>الميزانية</h2>
      
      <h3>الأصول</h3>
      <div class="summary">
        <div class="summary-row">
          <span>الرصيد الصافي (نقد):</span>
          <span class="amount">${formatCurrency(balanceData.balance.net)}</span>
        </div>
        <div class="summary-row">
          <span>ذمم مدينة (عملاء):</span>
          <span class="amount">${formatCurrency(balanceData.sales.debt)}</span>
        </div>
        <div class="summary-row total">
          <span>إجمالي الأصول:</span>
          <span class="amount">${formatCurrency(parseFloat(balanceData.balance.net) + parseFloat(balanceData.sales.debt))}</span>
        </div>
      </div>

      <h3>حقوق الملكية</h3>
      <div class="summary">
        <div class="summary-row">
          <span>رأس المال الافتتاحي:</span>
          <span class="amount">${formatCurrency(balanceData.balance.opening)}</span>
        </div>
        <div class="summary-row">
          <span>${profit >= 0 ? 'الأرباح المحتجزة' : 'الخسائر المتراكمة'}:</span>
          <span class="amount ${profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(Math.abs(profit))}</span>
        </div>
        <div class="summary-row total">
          <span>إجمالي حقوق الملكية:</span>
          <span class="amount">${formatCurrency(parseFloat(balanceData.balance.opening) + profit)}</span>
        </div>
      </div>
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

// Helper function to format currency
function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ar-SD', {
    style: 'currency',
    currency: 'SDG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
