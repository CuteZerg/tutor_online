'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

const navigation = [
  { name: 'Мои дети', href: '/parent' },
  { name: 'Расписание', href: '/parent/schedule' },
  { name: 'Оплата и баланс', href: '/parent/finances' },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <DashboardLayout title="Панель родителя" navigation={navigation}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
