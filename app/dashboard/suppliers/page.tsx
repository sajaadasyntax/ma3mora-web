'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function SuppliersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier(formData);
      setShowForm(false);
      setFormData({ name: '', phone: '', address: '' });
      loadSuppliers();
    } catch (error: any) {
      alert(error.message || 'فشل إضافة المورد');
    }
  };

  const columns = [
    { key: 'name', label: 'اسم المورد' },
    { key: 'phone', label: 'الهاتف' },
    { key: 'address', label: 'العنوان' },
  ];

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">الموردون</h1>
          <Button variant="secondary" onClick={() => router.push('/dashboard/suppliers/reports')}>
            تقرير الموردين
          </Button>
        </div>
        {user?.role === 'PROCUREMENT' && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'إلغاء' : 'إضافة مورد جديد'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit}>
            <Input
              label="اسم المورد"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

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

            <Button type="submit">حفظ</Button>
          </form>
        </Card>
      )}

      <Card>
        <Table 
          columns={columns} 
          data={suppliers}
          onRowClick={(row) => router.push(`/dashboard/suppliers/${row.id}`)}
        />
      </Card>
    </div>
  );
}

