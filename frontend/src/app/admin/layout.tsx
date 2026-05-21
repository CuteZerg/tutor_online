'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

const navigation = [
  { name: 'Schedule', href: '/admin' },
  { name: 'Сообщения', href: '/admin/chat' },
  { name: 'Students', href: '/admin/students' },
  { name: 'Finances', href: '/admin/finances' },
  { name: 'Materials', href: '/admin/materials' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['tutor']}>
      <DashboardLayout title="Tutor Dashboard" navigation={navigation}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
