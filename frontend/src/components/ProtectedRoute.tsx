'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('tutor' | 'student' | 'parent')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initAuth = async () => {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      
      if (!user) {
        await fetchUser();
      }
      setIsReady(true);
    };
    
    initAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After initial load, if auth state changes to unauthenticated, redirect
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600">Доступ запрещен</h2>
        <p className="mt-2 text-gray-600">У вас нет прав для просмотра этой страницы.</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
        >
          На главную
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
