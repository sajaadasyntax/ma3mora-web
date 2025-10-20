'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface PageProps {
  params: {
    id: string;
  };
}

export default function SupplierDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupplier();
  }, [params.id]);

  const loadSupplier = async () => {
    try {
      // For now, we'll get all suppliers and find the one we need
      // You may want to add a getSupplier(id) API endpoint
      const suppliers = await api.getSuppliers();
      const found = suppliers.find((s: any) => s.id === params.id);
      if (found) {
        setSupplier(found);
      } else {
        throw new Error('المورد غير موجود');
      }
    } catch (error) {
      console.error('Error loading supplier:', error);
      alert('فشل تحميل بيانات المورد');
      router.push('/dashboard/suppliers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!supplier) {
    return <div className="text-center py-8">المورد غير موجود</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="secondary" onClick={() => router.push('/dashboard/suppliers')}>
            ← رجوع
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Supplier Info */}
        <Card>
          <h2 className="text-2xl font-bold mb-4">{supplier.name}</h2>
          <div className="grid grid-cols-2 gap-4">
            {supplier.phone && (
              <div>
                <p className="text-gray-600">رقم الهاتف</p>
                <p className="font-semibold">{supplier.phone}</p>
              </div>
            )}
            {supplier.address && (
              <div>
                <p className="text-gray-600">العنوان</p>
                <p className="font-semibold">{supplier.address}</p>
              </div>
            )}
            <div>
              <p className="text-gray-600">تاريخ الإضافة</p>
              <p className="font-semibold">
                {new Date(supplier.createdAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

