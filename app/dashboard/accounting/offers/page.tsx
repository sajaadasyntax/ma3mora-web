'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Table from '@/components/Table';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Offer {
  id: string;
  itemId: string;
  offerPrice: number;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  item: {
    id: string;
    name: string;
    section: string;
  };
  creator: {
    id: string;
    username: string;
  };
}

export default function OffersPage() {
  const router = useRouter();
  const { user } = useUser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user has access
  useEffect(() => {
    if (user && user.role !== 'ACCOUNTANT' && user.role !== 'MANAGER') {
      router.push('/dashboard/accounting');
    }
  }, [user, router]);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [showEditOffer, setShowEditOffer] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [filterItemId, setFilterItemId] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  const [offerForm, setOfferForm] = useState({
    itemId: '',
    offerPrice: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    isActive: true,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadOffers();
  }, [filterItemId, filterActive]);

  const loadData = async () => {
    try {
      const [offersData, itemsData] = await Promise.all([
        api.getOffers(),
        api.getItems('BAKERY'),
      ]);
      setOffers(offersData || []);
      setItems(itemsData || []);
      if (!itemsData || itemsData.length === 0) {
        console.warn('No bakery items found. Make sure there are items in the BAKERY section.');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('فشل تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      const params: any = {};
      if (filterItemId) params.itemId = filterItemId;
      if (filterActive !== undefined) params.isActive = filterActive;
      
      const data = await api.getOffers(params);
      setOffers(data);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  const handleShowAddOffer = () => {
    // Ensure items are loaded before showing the modal
    if (items.length === 0) {
      loadData();
    }
    setShowAddOffer(true);
  };

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOffer({
        ...offerForm,
        offerPrice: parseFloat(offerForm.offerPrice),
        validTo: offerForm.validTo || null,
      });
      setOfferForm({
        itemId: '',
        offerPrice: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
        isActive: true,
        notes: '',
      });
      setShowAddOffer(false);
      loadOffers();
      alert('تم إضافة العرض بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل إضافة العرض');
      console.error('Error creating offer:', error);
    }
  };

  const handleEditOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;
    try {
      await api.updateOffer(editingOffer.id, {
        offerPrice: offerForm.offerPrice ? parseFloat(offerForm.offerPrice) : undefined,
        validFrom: offerForm.validFrom || undefined,
        validTo: offerForm.validTo || null,
        isActive: offerForm.isActive,
        notes: offerForm.notes,
      });
      setOfferForm({
        itemId: '',
        offerPrice: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
        isActive: true,
        notes: '',
      });
      setShowEditOffer(false);
      setEditingOffer(null);
      loadOffers();
      alert('تم تحديث العرض بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل تحديث العرض');
      console.error('Error updating offer:', error);
    }
  };

  const handleEditClick = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferForm({
      itemId: offer.itemId,
      offerPrice: offer.offerPrice.toString(),
      validFrom: new Date(offer.validFrom).toISOString().split('T')[0],
      validTo: offer.validTo ? new Date(offer.validTo).toISOString().split('T')[0] : '',
      isActive: offer.isActive,
      notes: offer.notes || '',
    });
    setShowEditOffer(true);
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    try {
      await api.deleteOffer(id);
      loadOffers();
      alert('تم حذف العرض بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل حذف العرض');
      console.error('Error deleting offer:', error);
    }
  };

  const offerColumns = [
    { key: 'item', label: 'الصنف', render: (_: any, offer: Offer) => offer.item.name },
    { key: 'offerPrice', label: 'سعر العرض', render: (value: number) => formatCurrency(value) },
    { 
      key: 'validFrom', 
      label: 'من تاريخ', 
      render: (value: string) => formatDateTime(value).split(' ')[0] 
    },
    { 
      key: 'validTo', 
      label: 'إلى تاريخ', 
      render: (value: string | null) => value ? formatDateTime(value).split(' ')[0] : 'غير محدد' 
    },
    { 
      key: 'isActive', 
      label: 'الحالة', 
      render: (value: boolean) => (
        <span className={value ? 'text-green-600 font-semibold' : 'text-gray-500'}>
          {value ? 'نشط' : 'غير نشط'}
        </span>
      ) 
    },
    { key: 'creator', label: 'أنشأ بواسطة', render: (_: any, offer: Offer) => offer.creator.username },
    { key: 'createdAt', label: 'تاريخ الإنشاء', render: (value: string) => formatDateTime(value) },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (_: any, offer: Offer) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleEditClick(offer)}
          >
            تعديل
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteOffer(offer.id)}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">العروض</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/dashboard/accounting')}>
            العودة للمحاسبة
          </Button>
          <Button onClick={handleShowAddOffer}>
            إضافة عرض جديد
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <h2 className="text-xl font-bold mb-4">فلترة العروض</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="الصنف"
            value={filterItemId}
            onChange={(e) => setFilterItemId(e.target.value)}
            options={[
              { value: '', label: 'جميع الأصناف' },
              ...items.map((item: any) => ({ value: item.id, label: item.name })),
            ]}
          />
          {items.length === 0 && !loading && (
            <p className="text-sm text-gray-500 col-span-3">لا توجد أصناف في قسم الأفران</p>
          )}
          <Select
            label="الحالة"
            value={filterActive === undefined ? '' : filterActive ? 'true' : 'false'}
            onChange={(e) => {
              if (e.target.value === '') {
                setFilterActive(undefined);
              } else {
                setFilterActive(e.target.value === 'true');
              }
            }}
            options={[
              { value: '', label: 'الكل' },
              { value: 'true', label: 'نشط' },
              { value: 'false', label: 'غير نشط' },
            ]}
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => {
              setFilterItemId('');
              setFilterActive(undefined);
            }}>
              مسح الفلاتر
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={offerColumns} data={offers} />
      </Card>

      {/* Add Offer Modal */}
      {showAddOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">إضافة عرض جديد</h2>
            <form onSubmit={handleAddOffer} className="space-y-4">
              <Select
                label="الصنف (أفران فقط)"
                value={offerForm.itemId}
                onChange={(e) => setOfferForm({ ...offerForm, itemId: e.target.value })}
                required
                options={[
                  { value: '', label: items.length === 0 ? 'جاري التحميل...' : 'اختر الصنف' },
                  ...items.map((item: any) => ({ value: item.id, label: item.name })),
                ]}
                disabled={items.length === 0}
              />
              {items.length === 0 && !loading && (
                <p className="text-sm text-red-600">لا توجد أصناف في قسم الأفران. يرجى إضافة أصناف أولاً.</p>
              )}
              <Input
                label="سعر العرض"
                type="number"
                step="0.01"
                value={offerForm.offerPrice}
                onChange={(e) => setOfferForm({ ...offerForm, offerPrice: e.target.value })}
                required
              />
              <Input
                label="من تاريخ"
                type="date"
                value={offerForm.validFrom}
                onChange={(e) => setOfferForm({ ...offerForm, validFrom: e.target.value })}
                required
              />
              <Input
                label="إلى تاريخ (اختياري - اتركه فارغاً للعرض غير المحدد)"
                type="date"
                value={offerForm.validTo}
                onChange={(e) => setOfferForm({ ...offerForm, validTo: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={offerForm.isActive}
                  onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  نشط
                </label>
              </div>
              <Input
                label="ملاحظات (اختياري)"
                value={offerForm.notes}
                onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit">إضافة</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddOffer(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Offer Modal */}
      {showEditOffer && editingOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">تعديل العرض</h2>
            <form onSubmit={handleEditOffer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الصنف</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                  {editingOffer.item.name}
                </div>
              </div>
              <Input
                label="سعر العرض"
                type="number"
                step="0.01"
                value={offerForm.offerPrice}
                onChange={(e) => setOfferForm({ ...offerForm, offerPrice: e.target.value })}
                required
              />
              <Input
                label="من تاريخ"
                type="date"
                value={offerForm.validFrom}
                onChange={(e) => setOfferForm({ ...offerForm, validFrom: e.target.value })}
                required
              />
              <Input
                label="إلى تاريخ (اختياري - اتركه فارغاً للعرض غير المحدد)"
                type="date"
                value={offerForm.validTo}
                onChange={(e) => setOfferForm({ ...offerForm, validTo: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={offerForm.isActive}
                  onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="editIsActive" className="text-sm text-gray-700">
                  نشط
                </label>
              </div>
              <Input
                label="ملاحظات (اختياري)"
                value={offerForm.notes}
                onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit">حفظ التغييرات</Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => {
                    setShowEditOffer(false);
                    setEditingOffer(null);
                    setOfferForm({
                      itemId: '',
                      offerPrice: '',
                      validFrom: new Date().toISOString().split('T')[0],
                      validTo: '',
                      isActive: true,
                      notes: '',
                    });
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

