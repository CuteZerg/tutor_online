'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Calendar from '@/components/calendar/Calendar';
import { api } from '@/lib/api';
import { Wallet, BookOpen, CalendarRange, Clock, Award, GraduationCap, ChevronRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface Homework {
  id: number;
  status: string;
}

interface Lesson {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  price: number;
  status: string;
}

export default function StudentDashboardPage() {
  const { user, fetchUser } = useAuthStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const lessonsRes = await api.get('/lessons/');
      setLessons(lessonsRes.data);

      const homeworksRes = await api.get('/homeworks/');
      setHomeworks(homeworksRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (fetchUser) {
      fetchUser();
    }
  }, []);

  // Compute metrics
  const activeHomeworks = homeworks.filter(hw => hw.status === 'pending');
  const upcomingLessons = lessons.filter(l => l.status === 'scheduled');
  const pendingLessons = lessons.filter(l => l.status === 'pending');
  
  // Find next scheduled lesson
  const nextLesson = upcomingLessons
    .filter(l => new Date(l.end_time) > new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

  const formatLessonDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
  };

  const isRoomActive = (lesson: Lesson) => {
    const now = new Date().getTime();
    const startTime = new Date(lesson.start_time).getTime();
    const endTime = new Date(lesson.end_time).getTime();
    const fifteenMins = 15 * 60 * 1000;
    return now >= (startTime - fifteenMins) && now <= endTime;
  };

  const formatLessonTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const handleConfirm = async (lessonId: number) => {
    try {
      await api.patch(`/lessons/${lessonId}/confirm`);
      loadData();
      if (fetchUser) fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка подтверждения');
    }
  };

  const handleDecline = async (lessonId: number) => {
    try {
      await api.patch(`/lessons/${lessonId}/decline`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка отмены');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-br from-indigo-900/35 to-violet-900/25 border border-indigo-500/10 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-slate-100 mb-2 tracking-tight">
            С возвращением, {user?.full_name}! 👋
          </h2>
          <p className="text-slate-400 max-w-2xl leading-relaxed text-sm">
            Ваша персональная панель обучения. Здесь вы можете управлять расписанием, бронировать свободные слоты репетитора, отслеживать домашние задания и пополнять баланс.
          </p>
        </div>
        <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.08] hidden lg:block select-none">
          <GraduationCap size={150} className="text-indigo-400" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance card */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-slate-800 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Текущий баланс</span>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 group-hover:scale-110 transition-transform">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-100 mb-2 select-none tracking-tight">
              {(user?.balance ?? 0).toLocaleString()} ₽
            </h3>
            <Link 
              href="/student/finances" 
              className="text-xs text-indigo-400 font-semibold flex items-center gap-1 hover:text-indigo-300 transition-colors"
            >
              Пополнить кошелек <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Lessons scheduled count */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-slate-800 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Запланировано уроков</span>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 group-hover:scale-110 transition-transform">
              <CalendarRange size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-100 mb-2 tracking-tight">
              {upcomingLessons.length} занятий
            </h3>
            <span className="text-xs text-slate-500 font-medium">ближайшее уже в вашем календаре</span>
          </div>
        </div>

        {/* Active Homework count */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-slate-800 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Активные ДЗ</span>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/10 group-hover:scale-110 transition-transform">
              <BookOpen size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-100 mb-2 tracking-tight">
              {activeHomeworks.length} задач
            </h3>
            <Link 
              href="/student/homework" 
              className="text-xs text-amber-400 font-semibold flex items-center gap-1 hover:text-amber-300 transition-colors"
            >
              Перейти к решению <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Workspace: Calendar & Highlight card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Calendar Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 select-none">
              <CalendarRange className="text-indigo-400" size={20} />
              Календарь и бронирование
            </h3>
            <span className="text-xs text-slate-500 flex items-center gap-1 select-none">
              <HelpCircle size={14} /> Выберите зеленый слот для бронирования
            </span>
          </div>

          <Calendar onLessonBooked={loadData} />
        </div>

        {/* Right Column: Next Lesson & Homework stats */}
        <div className="space-y-6">
          
          {/* Pending Approvals */}
          {pendingLessons.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 select-none">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                Ожидают подтверждения
              </h3>
              
              {pendingLessons.map(lesson => (
                <div key={lesson.id} className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl shadow-xl flex flex-col gap-4 relative overflow-hidden group">
                  <div>
                    <h4 className="text-md font-bold text-amber-400 mb-2 leading-snug">
                      {lesson.title || 'Предложенное занятие'}
                    </h4>
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold">{formatLessonDate(lesson.start_time)}</span><br/>
                      {formatLessonTime(lesson.start_time)} - {formatLessonTime(lesson.end_time)}
                    </p>
                    <p className="text-xs text-amber-200/60 mt-2 font-medium">Списание: {lesson.price} ₽</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleConfirm(lesson.id)}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-sm rounded-xl transition-colors"
                    >
                      Подтвердить
                    </button>
                    <button 
                      onClick={() => handleDecline(lesson.id)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition-colors"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Next Lesson Box */}
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 select-none">
            <Clock className="text-indigo-400" size={20} />
            Ближайший урок
          </h3>

          {nextLesson ? (
            <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/20 to-slate-900/40 border border-indigo-500/20 backdrop-blur-xl shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
              
              <div className="mb-6">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                  Подтверждено
                </span>
              </div>

              <h4 className="text-lg font-bold text-slate-100 mb-4 leading-snug group-hover:text-indigo-400 transition-colors">
                {nextLesson.title || 'Индивидуальное занятие'}
              </h4>

              <div className="space-y-3.5 mb-6 text-sm text-slate-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                    <CalendarRange size={14} />
                  </div>
                  <span className="capitalize">{formatLessonDate(nextLesson.start_time)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                    <Clock size={14} />
                  </div>
                  <span>
                    с {formatLessonTime(nextLesson.start_time)} до {formatLessonTime(nextLesson.end_time)}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between mb-4">
                <span className="text-xs text-slate-500 font-medium">Стоимость</span>
                <span className="text-md font-bold text-slate-200">{nextLesson.price.toLocaleString()} ₽</span>
              </div>
              
              <Link
                href={isRoomActive(nextLesson) ? `/room/${nextLesson.id}` : '#'}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${
                  isRoomActive(nextLesson) 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 cursor-pointer' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                onClick={(e) => { if (!isRoomActive(nextLesson)) e.preventDefault(); }}
              >
                {isRoomActive(nextLesson) ? 'Присоединиться к уроку' : 'Комната откроется за 15 мин'}
              </Link>
            </div>
          ) : (
            <div className="p-8 text-center rounded-3xl bg-slate-900/20 border border-slate-800/40 text-slate-500 flex flex-col items-center justify-center gap-3">
              <CalendarRange size={36} className="text-slate-800 mb-1" />
              <p className="text-sm font-medium">Нет запланированных уроков</p>
              <p className="text-xs text-slate-600 leading-relaxed px-4">
                Пожалуйста, выберите свободный слот в календаре слева, чтобы забронировать новое занятие!
              </p>
            </div>
          )}

          {/* Code Reference Card */}
          <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50 backdrop-blur-xl relative group">
            <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Award className="text-amber-400" size={16} />
              Раздел бэкапа и материалов
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Изучайте справочные руководства по Python, алгоритмические шпаргалки и инструкции по Git в нашем закрытом репозитории.
            </p>
            <Link 
              href="/student/materials" 
              className="text-xs text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-1"
            >
              Открыть библиотеку <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
