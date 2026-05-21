'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

const navigation = [
  { name: 'Расписание', href: '/student' },
  { name: 'Сообщения', href: '/student/chat' },
  { name: 'Материалы', href: '/student/materials' },
  { name: 'Домашние задания', href: '/student/homework' },
  { name: 'Оплата и финансы', href: '/student/finances' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <DashboardLayout title="Панель ученика" navigation={navigation}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
