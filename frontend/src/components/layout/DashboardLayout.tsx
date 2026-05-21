'use client';

import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { LogOut, User as UserIcon, Calendar, BookOpen, DollarSign, BookOpenCheck, MessageCircle } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  navigation: { name: string; href: string; icon?: React.ReactNode }[];
}

export default function DashboardLayout({ children, title, navigation }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const { unreadTotal, fetchUnreadTotal, connectWs, disconnectWs } = useChatStore();
  const pathname = usePathname();

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) return;

    fetchUnreadTotal();
    connectWs(token);

    return () => {
      // Disconnect when component unmounts (e.g. logout)
      disconnectWs();
    };
  }, [fetchUnreadTotal, connectWs, disconnectWs]);

  // Helper to map icons dynamically if they aren't passed
  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'schedule':
      case 'calendar':
      case 'расписание':
        return <Calendar size={18} />;
      case 'сообщения':
        return <MessageCircle size={18} />;
      case 'students':
      case 'ученики':
        return <UserIcon size={18} />;
      case 'finances':
      case 'оплата':
      case 'финансы':
        return <DollarSign size={18} />;
      case 'materials':
      case 'материалы':
        return <BookOpen size={18} />;
      case 'homework':
      case 'домашние задания':
        return <BookOpenCheck size={18} />;
      default:
        return <BookOpen size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Navigation Bar */}
        <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              
              {/* Brand Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                  T
                </div>
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
                  TutorOnline
                </span>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-inner'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`}
                    >
                      {getIcon(item.name)}
                      {item.name}
                      {item.name.toLowerCase() === 'сообщения' && unreadTotal > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] flex items-center justify-center font-bold text-white shadow-lg shadow-rose-500/30">
                          {unreadTotal}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* User Panel */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-200">{user?.full_name}</span>
                  <span className="text-xs text-slate-500 capitalize">{user?.role === 'tutor' ? 'Преподаватель' : user?.role === 'student' ? 'Ученик' : 'Родитель'}</span>
                </div>
                
                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                  <UserIcon size={18} />
                </div>

                <button
                  onClick={logout}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 hover:border-rose-500/20 text-rose-400 transition-all duration-300 hover:scale-105 active:scale-95"
                  title="Выйти"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Header Section */}
        <section className="bg-slate-950/20 py-8 border-b border-slate-900/60">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
              {title}
            </h1>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="flex-1 py-8">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
