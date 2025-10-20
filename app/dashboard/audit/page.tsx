'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Table from '@/components/Table';
import { formatDateTime, roleLabels } from '@/lib/utils';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'التاريخ',
      render: (value: string) => formatDateTime(value),
    },
    {
      key: 'user',
      label: 'المستخدم',
      render: (value: any) => `${value.username} (${roleLabels[value.role]})`,
    },
    { key: 'action', label: 'الإجراء' },
    { key: 'entity', label: 'الكيان' },
    { key: 'entityId', label: 'المعرف' },
  ];

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">سجلات التدقيق</h1>

      <Card>
        <Table columns={columns} data={logs} />
      </Card>
    </div>
  );
}

