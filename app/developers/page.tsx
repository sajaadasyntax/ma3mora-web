'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { roleLabels, sectionLabels } from '@/lib/utils';

export default function DevelopersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
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
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check if user is authenticated and is a MANAGER
      const response = await api.me();
      
      if (response.user.role !== 'MANAGER') {
        alert('غير مصرح - هذه الصفحة مخصصة للمطورين فقط');
        router.push('/dashboard');
        return;
      }

      setCurrentUser(response.user);
      await loadData();
    } catch (error) {
      console.error('Authentication error:', error);
      router.push('/login');
    }
  };

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
        if (!accesses.some(a => a.inventoryId === inventoryId && a.section === section)) {
          accesses.push({ inventoryId, section });
        }
      } else {
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

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <nav className="bg-gradient-to-r from-purple-900 to-indigo-900 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                👨‍💻 لوحة المطورين
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors"
              >
                العودة للوحة التحكم
              </button>
              <div className="text-sm text-white">
                <p className="font-medium">{currentUser?.username}</p>
                <p className="text-purple-200">مطور</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h2>
              <p className="text-gray-600 mt-1">إضافة وحذف وإدارة مستخدمي النظام</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'إلغاء' : '➕ إضافة مستخدم جديد'}
            </Button>
          </div>

          {showForm && (
            <Card>
              <h3 className="text-xl font-bold mb-4">إنشاء مستخدم جديد</h3>
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
            <h3 className="text-xl font-bold mb-4">قائمة المستخدمين ({users.length})</h3>
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
                        className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        تغيير كلمة المرور
                      </button>
                      <button
                        onClick={() => handleDelete(row.id, row.username)}
                        disabled={row.id === currentUser?.id}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          row.id === currentUser?.id
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                        title={row.id === currentUser?.id ? 'لا يمكنك حذف حسابك الخاص' : 'حذف المستخدم'}
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
        </div>
      </main>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
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

