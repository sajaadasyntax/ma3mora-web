'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Employee {
  id: string;
  name: string;
  position: string;
  phone?: string;
  address?: string;
  salary: number;
  isActive: boolean;
  salaries: Salary[];
  advances: Advance[];
}

interface Salary {
  id: string;
  amount: number;
  month: number;
  year: number;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  creator: { username: string; role: string };
}

interface Advance {
  id: string;
  amount: number;
  reason: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  creator: { username: string; role: string };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [showAddAdvance, setShowAddAdvance] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    position: '',
    phone: '',
    address: '',
    salary: '',
  });

  const [salaryForm, setSalaryForm] = useState({
    employeeId: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: '',
  });

  const [advanceForm, setAdvanceForm] = useState({
    employeeId: '',
    amount: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeDetails = async (employeeId: string) => {
    try {
      const [salariesData, advancesData] = await Promise.all([
        api.getEmployeeSalaries(employeeId),
        api.getEmployeeAdvances(employeeId),
      ]);
      setSalaries(salariesData);
      setAdvances(advancesData);
    } catch (error) {
      console.error('Error loading employee details:', error);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEmployee({
        ...employeeForm,
        salary: parseFloat(employeeForm.salary),
      });
      setEmployeeForm({ name: '', position: '', phone: '', address: '', salary: '' });
      setShowAddEmployee(false);
      loadEmployees();
    } catch (error) {
      console.error('Error creating employee:', error);
    }
  };

  const handleAddSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSalary({
        ...salaryForm,
        amount: parseFloat(salaryForm.amount),
      });
      setSalaryForm({ employeeId: '', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), notes: '' });
      setShowAddSalary(false);
      if (selectedEmployee) {
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Error creating salary:', error);
    }
  };

  const handleAddAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdvance({
        ...advanceForm,
        amount: parseFloat(advanceForm.amount),
      });
      setAdvanceForm({ employeeId: '', amount: '', reason: '', notes: '' });
      setShowAddAdvance(false);
      if (selectedEmployee) {
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Error creating advance:', error);
    }
  };

  const handlePaySalary = async (salaryId: string) => {
    try {
      await api.paySalary(salaryId);
      if (selectedEmployee) {
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Error paying salary:', error);
    }
  };

  const handlePayAdvance = async (advanceId: string) => {
    try {
      await api.payAdvance(advanceId);
      if (selectedEmployee) {
        loadEmployeeDetails(selectedEmployee.id);
      }
    } catch (error) {
      console.error('Error paying advance:', error);
    }
  };

  const employeeColumns = [
    { key: 'name', label: 'الاسم' },
    { key: 'position', label: 'المنصب' },
    { key: 'salary', label: 'الراتب', render: (value: number) => formatCurrency(value) },
    { key: 'phone', label: 'الهاتف' },
    { key: 'isActive', label: 'الحالة', render: (value: boolean) => value ? 'نشط' : 'غير نشط' },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (_: any, employee: Employee) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              setSelectedEmployee(employee);
              loadEmployeeDetails(employee.id);
            }}
          >
            التفاصيل
          </Button>
        </div>
      ),
    },
  ];

  const salaryColumns = [
    { key: 'month', label: 'الشهر', render: (value: number) => `${value}/${salaryForm.year}` },
    { key: 'amount', label: 'المبلغ', render: (value: number) => formatCurrency(value) },
    { key: 'paidAt', label: 'تاريخ الدفع', render: (value: string) => value ? formatDateTime(value) : 'لم يتم الدفع' },
    { key: 'creator', label: 'أنشأ بواسطة', render: (value: any) => value.username },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (_: any, salary: Salary) => (
        <div className="flex gap-2">
          {!salary.paidAt && (
            <Button
              size="sm"
              onClick={() => handlePaySalary(salary.id)}
            >
              دفع
            </Button>
          )}
        </div>
      ),
    },
  ];

  const advanceColumns = [
    { key: 'amount', label: 'المبلغ', render: (value: number) => formatCurrency(value) },
    { key: 'reason', label: 'السبب' },
    { key: 'paidAt', label: 'تاريخ الدفع', render: (value: string) => value ? formatDateTime(value) : 'لم يتم الدفع' },
    { key: 'creator', label: 'أنشأ بواسطة', render: (value: any) => value.username },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (_: any, advance: Advance) => (
        <div className="flex gap-2">
          {!advance.paidAt && (
            <Button
              size="sm"
              onClick={() => handlePayAdvance(advance.id)}
            >
              دفع
            </Button>
          )}
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
        <h1 className="text-3xl font-bold text-gray-900">إدارة الموظفين</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddEmployee(true)}>
            إضافة موظف
          </Button>
          <Button onClick={() => setShowAddSalary(true)}>
            إضافة راتب
          </Button>
          <Button onClick={() => setShowAddAdvance(true)}>
            إضافة سلفية
          </Button>
        </div>
      </div>

      <Card>
        <Table columns={employeeColumns} data={employees} />
      </Card>

      {selectedEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">رواتب {selectedEmployee.name}</h3>
              <Button
                size="sm"
                onClick={() => {
                  setSalaryForm({ ...salaryForm, employeeId: selectedEmployee.id });
                  setShowAddSalary(true);
                }}
              >
                إضافة راتب
              </Button>
            </div>
            <Table columns={salaryColumns} data={salaries} />
          </Card>

          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">سلفيات {selectedEmployee.name}</h3>
              <Button
                size="sm"
                onClick={() => {
                  setAdvanceForm({ ...advanceForm, employeeId: selectedEmployee.id });
                  setShowAddAdvance(true);
                }}
              >
                إضافة سلفية
              </Button>
            </div>
            <Table columns={advanceColumns} data={advances} />
          </Card>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة موظف جديد</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <Input
                label="الاسم"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                required
              />
              <Input
                label="المنصب"
                value={employeeForm.position}
                onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                required
              />
              <Input
                label="الراتب"
                type="number"
                value={employeeForm.salary}
                onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })}
                required
              />
              <Input
                label="الهاتف"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
              />
              <Input
                label="العنوان"
                value={employeeForm.address}
                onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit">إضافة</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddEmployee(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Salary Modal */}
      {showAddSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة راتب</h2>
            <form onSubmit={handleAddSalary} className="space-y-4">
              <Select
                label="الموظف"
                value={salaryForm.employeeId}
                onChange={(e) => setSalaryForm({ ...salaryForm, employeeId: e.target.value })}
                required
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.name} - ${emp.position}`,
                }))}
              />
              <Input
                label="المبلغ"
                type="number"
                value={salaryForm.amount}
                onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="الشهر"
                  value={salaryForm.month.toString()}
                  onChange={(e) => setSalaryForm({ ...salaryForm, month: parseInt(e.target.value) })}
                  required
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: (i + 1).toString(),
                    label: (i + 1).toString(),
                  }))}
                />
                <Input
                  label="السنة"
                  type="number"
                  value={salaryForm.year}
                  onChange={(e) => setSalaryForm({ ...salaryForm, year: parseInt(e.target.value) })}
                  required
                />
              </div>
              <Input
                label="ملاحظات"
                value={salaryForm.notes}
                onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit">إضافة</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddSalary(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Advance Modal */}
      {showAddAdvance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة سلفية</h2>
            <form onSubmit={handleAddAdvance} className="space-y-4">
              <Select
                label="الموظف"
                value={advanceForm.employeeId}
                onChange={(e) => setAdvanceForm({ ...advanceForm, employeeId: e.target.value })}
                required
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.name} - ${emp.position}`,
                }))}
              />
              <Input
                label="المبلغ"
                type="number"
                value={advanceForm.amount}
                onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                required
              />
              <Input
                label="السبب"
                value={advanceForm.reason}
                onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                required
              />
              <Input
                label="ملاحظات"
                value={advanceForm.notes}
                onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit">إضافة</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddAdvance(false)}>
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
