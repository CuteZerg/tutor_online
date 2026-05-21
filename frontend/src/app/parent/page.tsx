'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import Calendar from '@/components/calendar/Calendar';
import { 
  Users, 
  Wallet, 
  BookOpen, 
  CalendarRange, 
  Clock, 
  GraduationCap, 
  ChevronRight, 
  Activity,
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Code2,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

interface Child {
  id: number;
  full_name: string;
  email: string;
  balance: number;
}

interface Homework {
  id: number;
  description: string;
  status: 'pending' | 'submitted' | 'graded';
  due_date: string;
  grade?: number;
  feedback?: string;
  student_code?: string;
  lesson_id: number;
}

interface Lesson {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  price: number;
  status: 'open' | 'scheduled' | 'completed' | 'cancelled';
}

export default function ParentDashboardPage() {
  const { user } = useAuthStore();
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const loadData = async () => {
    try {
      const childrenRes = await api.get('/users/children');
      setChildrenList(childrenRes.data);

      const homeworksRes = await api.get('/homeworks/');
      setHomeworks(homeworksRes.data);

      const lessonsRes = await api.get('/lessons/');
      setLessons(lessonsRes.data);
    } catch (err) {
      console.error('Failed to load parent dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helpers
  const activeHomeworks = homeworks.filter(hw => hw.status === 'pending');
  const upcomingLessons = lessons.filter(l => l.status === 'scheduled');
  
  // Next lesson
  const nextLesson = upcomingLessons
    .filter(l => new Date(l.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

  const formatLessonDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
  };

  const formatLessonTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-br from-indigo-900/35 to-violet-900/25 border border-indigo-500/10 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-slate-100 mb-2 tracking-tight">
            Кабинет родительского контроля 👨‍👩‍👦
          </h2>
          <p className="text-slate-400 max-w-2xl leading-relaxed text-sm">
            Здравствуйте, {user?.full_name}! Здесь вы можете отслеживать учебный прогресс вашего ребенка, просматривать расписание занятий, статус выполнения домашних заданий и пополнять баланс обучения.
          </p>
        </div>
        <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.08] hidden lg:block select-none">
          <Users size={150} className="text-indigo-400" />
        </div>
      </div>

      {/* Children Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 select-none">
          <GraduationCap className="text-indigo-400" size={22} />
          Учебные профили детей
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {childrenList.map((child) => (
            <div 
              key={child.id}
              className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-slate-800 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-slate-100 shadow-md">
                  {child.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {child.full_name}
                  </h4>
                  <span className="text-slate-500 text-xs">{child.email}</span>
                </div>
              </div>

              <div className="flex flex-col items-end border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Баланс ученика</span>
                <span className="text-2xl font-black text-emerald-400 mb-2">{(child.balance ?? 0).toLocaleString()} ₽</span>
                <Link
                  href="/parent/finances"
                  className="px-4 py-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                >
                  Пополнить <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}

          {childrenList.length === 0 && (
            <div className="p-8 text-center rounded-3xl bg-slate-900/20 border border-slate-800/40 text-slate-500 md:col-span-2">
              <Users size={32} className="mx-auto text-slate-700 mb-2" />
              <p className="text-sm font-medium">Дети не привязаны к вашему аккаунту</p>
              <p className="text-xs text-slate-600 mt-1">Обратитесь к администратору или преподавателю для настройки связей.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Homeworks, Calendar & Lesson Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 select-none">
              <CalendarRange className="text-indigo-400" size={20} />
              Расписание занятий
            </h3>
            <span className="text-xs text-slate-500">Режим просмотра</span>
          </div>

          <Calendar />
        </div>

        {/* Right Column: Next Lesson & Homework Monitoring */}
        <div className="space-y-6">
          {/* Next Lesson Box */}
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 select-none">
            <Clock className="text-indigo-400" size={20} />
            Ближайшее занятие ребенка
          </h3>

          {nextLesson ? (
            <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/20 to-slate-900/40 border border-indigo-500/20 backdrop-blur-xl shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
              
              <div className="mb-6">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                  Запланировано
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

              <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Стоимость</span>
                <span className="text-md font-bold text-slate-200">{nextLesson.price.toLocaleString()} ₽</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-3xl bg-slate-900/20 border border-slate-800/40 text-slate-500 flex flex-col items-center justify-center gap-3">
              <CalendarRange size={36} className="text-slate-800 mb-1" />
              <p className="text-sm font-medium">Нет ближайших уроков</p>
              <p className="text-xs text-slate-600 px-4">
                Свободные слоты создаются репетитором и бронируются со стороны ученика в его панели.
              </p>
            </div>
          )}

          {/* Homework progress stats */}
          <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50 backdrop-blur-xl relative group space-y-4">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="text-amber-400" size={16} />
              Статус домашних заданий
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/60 text-center">
                <span className="text-2xl font-black text-amber-400">{activeHomeworks.length}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">Ожидают</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/60 text-center">
                <span className="text-2xl font-black text-emerald-400">
                  {homeworks.filter(hw => hw.status === 'graded').length}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">Оценено</span>
              </div>
            </div>

            {/* List of latest homeworks */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Последние задания</span>
              
              {homeworks.slice(0, 5).map((hw) => (
                <div
                  key={hw.id}
                  onClick={() => setSelectedHomework(hw)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-xs space-y-2 cursor-pointer hover:border-indigo-500/30 hover:bg-slate-950/90 transition-all duration-200 group/hw"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      hw.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : hw.status === 'submitted'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {hw.status === 'pending' ? 'В процессе' : hw.status === 'submitted' ? 'На проверке' : 'Оценено'}
                    </span>
                    <span className="text-slate-500 text-[10px]">до {new Date(hw.due_date).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <p className="text-slate-300 font-semibold truncate leading-normal group-hover/hw:text-indigo-300 transition-colors">{hw.description}</p>
                  
                  {hw.status === 'graded' && (
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-900 text-emerald-400">
                      <Award size={14} />
                      <span className="font-bold text-[11px]">Оценка: {hw.grade}/10</span>
                    </div>
                  )}
                </div>
              ))}

              {homeworks.length === 0 && (
                <div className="text-center p-4 text-xs text-slate-600">Нет выданных домашних заданий</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Homework Detail Modal */}
      {selectedHomework && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full relative shadow-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedHomework(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
              <FileText className="text-indigo-400" />
              Подробности задания
            </h3>

            <div className="space-y-5">
              {/* Status & Due Date */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedHomework.status === 'pending'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : selectedHomework.status === 'submitted'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {selectedHomework.status === 'pending' ? 'В процессе' : selectedHomework.status === 'submitted' ? 'На проверке' : 'Оценено'}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <Clock size={13} />
                  Срок: {new Date(selectedHomework.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Описание задания</span>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedHomework.description}</p>
              </div>

              {/* Student Code */}
              {selectedHomework.student_code && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Code2 size={12} className="text-indigo-400" />
                    Код ребенка
                  </span>
                  <pre className="mt-2 text-xs text-emerald-300 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800/40 overflow-x-auto max-h-48 leading-relaxed">
                    <code>{selectedHomework.student_code}</code>
                  </pre>
                </div>
              )}

              {!selectedHomework.student_code && selectedHomework.status === 'pending' && (
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800/60 text-center">
                  <Code2 size={24} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">Ребенок еще не отправил решение</p>
                </div>
              )}

              {/* Grade */}
              {selectedHomework.status === 'graded' && selectedHomework.grade !== undefined && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/20 to-yellow-900/10 border border-amber-500/20 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Award size={24} className="text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest block">Оценка преподавателя</span>
                    <span className="text-2xl font-black text-amber-400">{selectedHomework.grade}<span className="text-sm text-slate-500 font-medium">/10</span></span>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {selectedHomework.feedback && (
                <div className="p-4 rounded-2xl bg-indigo-950/15 border border-indigo-500/15">
                  <span className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-indigo-400" />
                    Комментарий преподавателя
                  </span>
                  <p className="text-slate-200 text-sm leading-relaxed mt-2 italic">«{selectedHomework.feedback}»</p>
                </div>
              )}

              {!selectedHomework.feedback && selectedHomework.status !== 'graded' && (
                <div className="p-4 rounded-2xl bg-slate-950/30 border border-dashed border-slate-800/40 text-center">
                  <MessageSquare size={20} className="text-slate-700 mx-auto mb-1" />
                  <p className="text-xs text-slate-600">Отзыв преподавателя появится после проверки</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedHomework(null)}
              className="mt-6 w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-semibold transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
