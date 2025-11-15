'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { formatCurrency, formatDateTime, customerTypeLabels, sectionLabels, paymentStatusLabels } from '@/lib/utils';
import { generateCustomerReportPDF } from '@/lib/pdfUtils';

interface PageProps {
  params: {
    id: string;
  };
}

export default function CustomerDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { user } = useUser();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'WHOLESALE' as 'WHOLESALE' | 'RETAIL' | 'AGENT',
    division: 'GROCERY' as 'GROCERY' | 'BAKERY',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadCustomer();
  }, [params.id]);

  const loadCustomer = async () => {
    try {
      const data = await api.getCustomer(params.id);
      setCustomer(data);
      // Initialize edit form data
      setEditFormData({
        name: data.name || '',
        type: data.type || 'WHOLESALE',
        division: data.division || 'GROCERY',
        phone: data.phone || '',
        address: data.address || '',
      });
    } catch (error) {
      console.error('Error loading customer:', error);
      alert('فشل تحميل بيانات العميل');
      router.push('/dashboard/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.updateCustomer(params.id, editFormData);
      // Reload customer data to get full object with relationships
      await loadCustomer();
      setShowEditModal(false);
      alert('تم تحديث بيانات العميل بنجاح');
    } catch (error: any) {
      console.error('Error updating customer:', error);
      alert(error.message || 'فشل تحديث بيانات العميل');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!customer) {
    return <div className="text-center py-8">العميل غير موجود</div>;
  }

  // Filter out rejected invoices (just in case)
  const validInvoices = customer.salesInvoices?.filter(
    (invoice: any) => invoice.paymentConfirmationStatus !== 'REJECTED'
  ) || [];

  // Calculate outstanding balance (accounts receivable)
  const calculateOutstanding = () => {
    if (!validInvoices || validInvoices.length === 0) {
      return { accountsReceivable: 0, openingBalance: 0, netOutstanding: 0 };
    }
    
    const accountsReceivable = validInvoices.reduce((total: number, invoice: any) => {
      const invoiceTotal = parseFloat(invoice.total);
      const paidAmount = parseFloat(invoice.paidAmount);
      const remaining = invoiceTotal - paidAmount;
      return total + remaining;
    }, 0);
    
    // Opening balance: positive = we owe customer, negative = customer owes us
    const openingBalance = customer.openingBalance?.reduce((total: number, ob: any) => {
      return total + parseFloat(ob.amount);
    }, 0) || 0;
    
    // Net outstanding: positive = customer owes us, negative = we owe customer
    const netOutstanding = accountsReceivable + openingBalance;
    
    return { accountsReceivable, openingBalance, netOutstanding };
  };

  const outstanding = calculateOutstanding();

  // Calculate total sales
  const totalSales = validInvoices.reduce((total: number, invoice: any) => {
    return total + parseFloat(invoice.total);
  }, 0);

  // Calculate total paid
  const totalPaid = validInvoices.reduce((total: number, invoice: any) => {
    return total + parseFloat(invoice.paidAmount);
  }, 0);

  const invoiceColumns = [
    { key: 'invoiceNumber', label: 'رقم الفاتورة' },
    {
      key: 'total',
      label: 'المجموع',
      render: (value: any) => formatCurrency(value),
    },
    {
      key: 'paidAmount',
      label: 'المدفوع',
      render: (value: any) => formatCurrency(value),
    },
    {
      key: 'remaining',
      label: 'المتبقي',
      render: (_: any, row: any) => {
        const remaining = parseFloat(row.total) - parseFloat(row.paidAmount);
        return (
          <span className={remaining > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {formatCurrency(remaining)}
          </span>
        );
      },
    },
    {
      key: 'paymentStatus',
      label: 'حالة الدفع',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            value === 'PAID'
              ? 'bg-green-100 text-green-800'
              : value === 'PARTIAL'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {paymentStatusLabels[value]}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'التاريخ',
      render: (value: string) => formatDateTime(value),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="secondary" onClick={() => router.push('/dashboard/customers')}>
            ← رجوع
          </Button>
        </div>
        <div className="flex gap-2">
          {user?.role === 'MANAGER' && (
            <Button
              onClick={() => setShowEditModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              ✏️ تعديل بيانات العميل
            </Button>
          )}
          <Button
            onClick={() => generateCustomerReportPDF(customer)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            📄 طباعة تقرير العميل
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Customer Info */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">{customer.name}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">النوع</p>
              <p className="font-semibold">{customerTypeLabels[customer.type]}</p>
            </div>
            <div>
              <p className="text-gray-600">القسم</p>
              <p className="font-semibold">{sectionLabels[customer.division]}</p>
            </div>
            {customer.phone && (
              <div>
                <p className="text-gray-600">رقم الهاتف</p>
                <p className="font-semibold">{customer.phone}</p>
              </div>
            )}
            {customer.address && (
              <div>
                <p className="text-gray-600">العنوان</p>
                <p className="font-semibold">{customer.address}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Financial Summary - Accounts Receivable */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">الملخص المالي</h3>
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalSales)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-1">المدفوع</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
            </div>
            <div className={`p-4 rounded-lg border ${
              outstanding.accountsReceivable > 0 
                ? 'bg-red-50 border-red-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-sm text-gray-600 mb-1">الذمم المدينة (من الفواتير)</p>
              <p className={`text-2xl font-bold ${
                outstanding.accountsReceivable > 0 ? 'text-red-700' : 'text-gray-700'
              }`}>
                {formatCurrency(outstanding.accountsReceivable)}
              </p>
            </div>
          </div>
          
          {/* Opening Balance Info */}
          {outstanding.openingBalance !== 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-600 mb-1">
                {outstanding.openingBalance > 0 
                  ? 'رصيد افتتاحي (نحن مدينون للعميل)' 
                  : 'رصيد افتتاحي (العميل مدين لنا)'}
              </p>
              <p className={`text-xl font-bold ${
                outstanding.openingBalance > 0 ? 'text-orange-700' : 'text-purple-700'
              }`}>
                {outstanding.openingBalance > 0 ? '+' : ''}{formatCurrency(outstanding.openingBalance)}
              </p>
            </div>
          )}
          
          {/* Net Outstanding */}
          <div className={`mt-4 p-4 rounded-lg border ${
            outstanding.netOutstanding > 0 
              ? 'bg-red-50 border-red-300' 
              : outstanding.netOutstanding < 0
              ? 'bg-orange-50 border-orange-300'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {outstanding.netOutstanding > 0 
                ? '✅ المتبقي الإجمالي: العميل مدين لنا' 
                : outstanding.netOutstanding < 0
                ? '⚠️ المتبقي الإجمالي: نحن مدينون للعميل'
                : '✓ المتبقي الإجمالي: متساوي'}
            </p>
            <p className={`text-2xl font-bold ${
              outstanding.netOutstanding > 0 ? 'text-red-700' : 
              outstanding.netOutstanding < 0 ? 'text-orange-700' : 'text-gray-700'
            }`}>
              {formatCurrency(Math.abs(outstanding.netOutstanding))}
            </p>
          </div>
        </Card>

        {/* Recent Invoices */}
        {validInvoices && validInvoices.length > 0 ? (
          <Card>
            <h3 className="text-xl font-semibold mb-4">الفواتير ({validInvoices.length})</h3>
            <Table 
              columns={invoiceColumns} 
              data={validInvoices}
              onRowClick={(row) => router.push(`/dashboard/sales/${row.id}`)}
            />
          </Card>
        ) : (
          <Card>
            <p className="text-gray-500 text-center py-8">لا توجد فواتير لهذا العميل</p>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">تعديل بيانات العميل</h2>
              <form onSubmit={handleEditSubmit}>
                <Input
                  label="اسم العميل"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />

                <Select
                  label="نوع العميل"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as 'WHOLESALE' | 'RETAIL' | 'AGENT' })}
                  options={[
                    { value: 'WHOLESALE', label: 'جملة' },
                    { value: 'RETAIL', label: 'قطاعي' },
                    { value: 'AGENT', label: 'وكيل' },
                  ]}
                  required
                />

                <Select
                  label="القسم"
                  value={editFormData.division}
                  onChange={(e) => setEditFormData({ ...editFormData, division: e.target.value as 'GROCERY' | 'BAKERY' })}
                  options={[
                    { value: 'GROCERY', label: 'بقالة' },
                    { value: 'BAKERY', label: 'أفران' },
                  ]}
                  required
                />

                <Input
                  label="رقم الهاتف"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />

                <Input
                  label="العنوان"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />

                <div className="flex gap-2 mt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowEditModal(false)}
                    disabled={submitting}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

