'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@/lib/userContext';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import MultiSelect from '@/components/MultiSelect';
import { roleLabels, sectionLabels } from '@/lib/utils';

export default function DevelopersPage() {
  const { user } = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'SALES_GROCERY',
    inventoryAccesses: [] as Array<{ inventoryId: string; section: string }>,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, inventoriesData] = await Promise.all([
        api.getUsers(),
        api.getInventories(),
      ]);
      setUsers(usersData);
      setInventories(inventoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.createUser(formData);
      alert('تم إنشاء المستخدم بنجاح');
      setShowForm(false);
      setFormData({
        username: '',
        password: '',
        role: 'SALES_GROCERY',
        inventoryAccesses: [],
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error.message || 'خطأ في إنشاء المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم: ${username}؟`)) {
      return;
    }

    try {
      await api.deleteUser(id);
      alert('تم حذف المستخدم بنجاح');
      loadData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'خطأ في حذف المستخدم');
    }
  };

  const handlePasswordUpdate = async () => {
    if (!selectedUserId || !newPassword) {
      alert('يرجى إدخال كلمة مرور جديدة');
      return;
    }

    if (newPassword.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      await api.updateUserPassword(selectedUserId, newPassword);
      alert('تم تحديث كلمة المرور بنجاح');
      setShowPasswordModal(false);
      setSelectedUserId(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      alert(error.message || 'خطأ في تحديث كلمة المرور');
    }
  };

  const handleInventoryAccessChange = (inventoryId: string, section: string, isChecked: boolean) => {
    setFormData(prev => {
      let accesses = [...prev.inventoryAccesses];
      
      if (isChecked) {
        // Add access if not exists
        if (!accesses.some(a => a.inventoryId === inventoryId && a.section === section)) {
          accesses.push({ inventoryId, section });
        }
      } else {
        // Remove access
        accesses = accesses.filter(a => !(a.inventoryId === inventoryId && a.section === section));
      }
      
      return { ...prev, inventoryAccesses: accesses };
    });
  };

  const isAccessSelected = (inventoryId: string, section: string) => {
    return formData.inventoryAccesses.some(
      a => a.inventoryId === inventoryId && a.section === section
    );
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">لوحة المطورين - إدارة المستخدمين</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : '➕ إضافة مستخدم جديد'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <h2 className="text-xl font-bold mb-4">إنشاء مستخدم جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="اسم المستخدم"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="أدخل اسم المستخدم (3 أحرف على الأقل)"
            />

            <Input
              label="كلمة المرور"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
            />

            <Select
              label="الدور الوظيفي"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              options={[
                { value: 'SALES_GROCERY', label: 'مبيعات - بقالة' },
                { value: 'SALES_BAKERY', label: 'مبيعات - أفران' },
                { value: 'AGENT_GROCERY', label: 'وكيل - بقالة' },
                { value: 'AGENT_BAKERY', label: 'وكيل - أفران' },
                { value: 'INVENTORY', label: 'المخازن' },
                { value: 'PROCUREMENT', label: 'المشتريات' },
                { value: 'ACCOUNTANT', label: 'محاسب' },
                { value: 'AUDITOR', label: 'مدقق' },
                { value: 'MANAGER', label: 'مدير' },
              ]}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                صلاحيات الوصول للمخازن
              </label>
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                {inventories.map((inventory) => (
                  <div key={inventory.id} className="space-y-2">
                    <div className="font-semibold text-gray-900">{inventory.name}</div>
                    <div className="flex gap-4 mr-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isAccessSelected(inventory.id, 'GROCERY')}
                          onChange={(e) => handleInventoryAccessChange(
                            inventory.id,
                            'GROCERY',
                            e.target.checked
                          )}
                          className="rounded border-gray-300"
                        />
                        <span>بقالة</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isAccessSelected(inventory.id, 'BAKERY')}
                          onChange={(e) => handleInventoryAccessChange(
                            inventory.id,
                            'BAKERY',
                            e.target.checked
                          )}
                          className="rounded border-gray-300"
                        />
                        <span>أفران</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setShowForm(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-bold mb-4">قائمة المستخدمين</h2>
        <Table
          columns={[
            { key: 'username', label: 'اسم المستخدم' },
            { key: 'role', label: 'الدور', render: (_, row) => roleLabels[row.role] },
            { 
              key: 'accesses', 
              label: 'صلاحيات الوصول',
              render: (_, row) => (
                <div className="space-y-1">
                  {row.accesses && row.accesses.length > 0 ? (
                    row.accesses.map((access: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        {access.inventory.name} - {sectionLabels[access.section]}
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400">لا توجد صلاحيات</span>
                  )}
                </div>
              )
            },
            { 
              key: 'createdAt', 
              label: 'تاريخ الإنشاء',
              render: (_, row) => new Date(row.createdAt).toLocaleDateString('ar-EG')
            },
            {
              key: 'actions',
              label: 'الإجراءات',
              render: (_, row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedUserId(row.id);
                      setShowPasswordModal(true);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    تغيير كلمة المرور
                  </button>
                  <button
                    onClick={() => handleDelete(row.id, row.username)}
                    disabled={row.id === user?.id}
                    className={`px-3 py-1 text-sm rounded ${
                      row.id === user?.id
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                    title={row.id === user?.id ? 'لا يمكنك حذف حسابك الخاص' : 'حذف المستخدم'}
                  >
                    حذف
                  </button>
                </div>
              ),
            },
          ]}
          data={users}
        />
      </Card>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">تحديث كلمة المرور</h3>
            <Input
              label="كلمة المرور الجديدة"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUserId(null);
                  setNewPassword('');
                }}
              >
                إلغاء
              </Button>
              <Button type="button" onClick={handlePasswordUpdate}>
                تحديث كلمة المرور
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

