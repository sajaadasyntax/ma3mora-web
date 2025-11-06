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
import { customerTypeLabels, sectionLabels } from '@/lib/utils';

export default function CustomersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Determine section based on user role
  const getUserSection = () => {
    if (user?.role === 'SALES_GROCERY' || user?.role === 'AGENT_GROCERY') return 'GROCERY';
    if (user?.role === 'SALES_BAKERY' || user?.role === 'AGENT_BAKERY') return 'BAKERY';
    return 'GROCERY'; // Default
  };

  const [formData, setFormData] = useState({
    name: '',
    type: 'WHOLESALE',
    division: getUserSection(),
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, division: getUserSection() }));
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    try {
      // Filter customers by division for sales and agent users
      const params: any = {};
      if (user?.role === 'SALES_GROCERY' || user?.role === 'SALES_BAKERY' || user?.role === 'AGENT_GROCERY' || user?.role === 'AGENT_BAKERY') {
        params.division = getUserSection();
      }
      
      const data = await api.getCustomers(params);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCustomer(formData);
      setShowForm(false);
      setFormData({
        name: '',
        type: 'WHOLESALE',
        division: getUserSection(),
        phone: '',
        address: '',
      });
      await loadCustomers();
      alert('تم إضافة العميل بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل إضافة العميل');
    } finally {
      setSubmitting(false);
    }
  };

  // Hide division column for sales and agent users since they only see their section
  const columns = [
    { key: 'name', label: 'اسم العميل' },
    {
      key: 'type',
      label: 'النوع',
      render: (value: string) => customerTypeLabels[value],
    },
    ...(user?.role !== 'SALES_GROCERY' && user?.role !== 'SALES_BAKERY' && user?.role !== 'AGENT_GROCERY' && user?.role !== 'AGENT_BAKERY' ? [{
      key: 'division',
      label: 'القسم',
      render: (value: string) => sectionLabels[value],
    }] : []),
    { key: 'phone', label: 'الهاتف' },
  ];

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">العملاء</h1>
          <Button variant="secondary" onClick={() => router.push('/dashboard/customers/reports')}>
            تقرير العملاء
          </Button>
        </div>
        {(user?.role === 'SALES_GROCERY' || user?.role === 'SALES_BAKERY' || user?.role === 'AGENT_GROCERY' || user?.role === 'AGENT_BAKERY') && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'إلغاء' : 'إضافة عميل جديد'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit}>
            <Input
              label="اسم العميل"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Select
              label="نوع العميل"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={
                user?.role === 'AGENT_GROCERY' || user?.role === 'AGENT_BAKERY'
                  ? [
                      { value: 'AGENT', label: 'وكيل' },
                      { value: 'WHOLESALE', label: 'جملة' },
                      { value: 'RETAIL', label: 'قطاعي' },
                    ]
                  : [
                      { value: 'WHOLESALE', label: 'جملة' },
                      { value: 'RETAIL', label: 'قطاعي' },
                    ]
              }
            />

            {/* Hide section selector for sales and agent users - they can only access their assigned section */}
            {user?.role !== 'SALES_GROCERY' && user?.role !== 'SALES_BAKERY' && user?.role !== 'AGENT_GROCERY' && user?.role !== 'AGENT_BAKERY' ? (
              <Select
                label="القسم"
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                options={[
                  { value: 'GROCERY', label: 'بقالة' },
                  { value: 'BAKERY', label: 'أفران' },
                ]}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                  {formData.division === 'GROCERY' ? 'بقالة' : 'أفران'}
                </div>
              </div>
            )}

            <Input
              label="رقم الهاتف"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="العنوان"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <Button 
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <Table 
          columns={columns} 
          data={customers}
          onRowClick={(row) => router.push(`/dashboard/customers/${row.id}`)}
        />
      </Card>
    </div>
  );
}

