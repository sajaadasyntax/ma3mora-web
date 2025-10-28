'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Card from '@/components/Card';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Check if session was expired
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expired = sessionStorage.getItem('sessionExpired');
      if (expired === 'true') {
        setSessionExpired(true);
        setError('تم إنهاء جلستك بسبب تسجيل الدخول من مكان آخر. يرجى تسجيل الدخول مرة أخرى.');
        sessionStorage.removeItem('sessionExpired');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(username, password);
      console.log('تم تسجيل الدخول:', response);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md px-4">
        <Card className="shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              نظام إدارة المخزون
            </h1>
            <p className="text-gray-600">مرحباً بك، يرجى تسجيل الدخول</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="اسم المستخدم"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              required
            />

            <Input
              label="كلمة المرور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              required
            />

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="mb-2">حسابات تجريبية:</p>
            <div className="text-xs space-y-1">
              <p>محاسب: accountant / password123</p>
              <p>مبيعات بقالة: sales_grocery / password123</p>
              <p>مبيعات أفران: sales_bakery / password123</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

