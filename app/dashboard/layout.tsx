'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { roleLabels } from '@/lib/utils';
import { UserProvider } from '@/lib/userContext';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasOpeningBalance, setHasOpeningBalance] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user && (user.role === 'ACCOUNTANT' || user.role === 'MANAGER')) {
      checkOpeningBalance();
    }
  }, [user, pathname]);

  const loadUser = async () => {
    try {
      const response = await api.me();
      setUser(response.user);
    } catch (error: any) {
      // If session expired, show message before redirecting
      if (error.sessionExpired) {
        alert('تم إنهاء جلستك بسبب تسجيل الدخول من مكان آخر');
      }
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const checkOpeningBalance = async () => {
    try {
      // Use optimized balance status endpoint
      const status = await api.getBalanceStatus();
      // Check if balance is open (support both old and new response formats)
      const isOpen = status.isOpen || (status.balances && Object.values(status.balances).some((v: any) => v > 0));
      setHasOpeningBalance(isOpen);
      
      // Redirect to opening balance page if none exists and not already there
      if (!isOpen && pathname !== '/dashboard/accounting/opening-balance') {
        router.push('/dashboard/accounting/opening-balance');
      }
    } catch (error) {
      console.error('Error checking opening balance:', error);
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show warning message for accountant/manager without opening balance
  if ((user.role === 'ACCOUNTANT' || user.role === 'MANAGER') && !hasOpeningBalance && pathname !== '/dashboard/accounting/opening-balance') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              يجب فتح حساب أولاً
            </h1>
            <p className="text-gray-600 mb-6">
              لا يمكنك الوصول للنظام قبل إدخال رأس المال الافتتاحي (كاش، بنكك، بنك النيل)
            </p>
            <button
              onClick={() => router.push('/dashboard/accounting/opening-balance')}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
            >
              فتح الحساب الآن
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'المخازن', href: '/dashboard/inventories', roles: ['*'] },
    { name: 'العملاء', href: '/dashboard/customers', roles: ['SALES_GROCERY', 'SALES_BAKERY', 'ACCOUNTANT', 'AUDITOR', 'MANAGER'] },
    { name: 'فواتير المبيعات', href: '/dashboard/sales', roles: ['SALES_GROCERY', 'SALES_BAKERY', 'INVENTORY', 'ACCOUNTANT', 'AUDITOR', 'MANAGER'] },
    { name: 'تقارير المبيعات', href: '/dashboard/sales-reports', roles: ['ACCOUNTANT', 'AUDITOR', 'MANAGER'] },
    { name: 'الموردون', href: '/dashboard/suppliers', roles: ['PROCUREMENT', 'ACCOUNTANT', 'AUDITOR', 'MANAGER'] },
    { name: 'أوامر الشراء', href: '/dashboard/procurement', roles: ['PROCUREMENT', 'INVENTORY', 'ACCOUNTANT', 'AUDITOR', 'MANAGER'] },
    { name: 'الأصناف والأسعار', href: '/dashboard/items', roles: ['ACCOUNTANT', 'PROCUREMENT', 'AUDITOR', 'MANAGER'] },
    { name: 'الموظفين', href: '/dashboard/employees', roles: ['ACCOUNTANT', 'MANAGER'] },
    { name: 'المحاسبة', href: '/dashboard/accounting', roles: ['ACCOUNTANT', 'AUDITOR', 'MANAGER'] },
    { name: 'سجلات التدقيق', href: '/dashboard/audit', roles: ['AUDITOR', 'ACCOUNTANT', 'MANAGER'] },
  ];

  const filteredNav = navigation.filter(
    (item) => item.roles.includes('*') || item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  نظام إدارة المخزون
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.username}</p>
                <p className="text-gray-500">{roleLabels[user.role]}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow-md min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <UserProvider user={user}>
            <div className="max-w-7xl mx-auto">{children}</div>
          </UserProvider>
        </main>
      </div>
    </div>
  );
}

