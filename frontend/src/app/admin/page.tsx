'use client';

import React from 'react';
import Calendar from '@/components/calendar/Calendar';
import { CalendarRange, Info } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900/30 to-violet-900/20 border border-indigo-500/10 backdrop-blur-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Добро пожаловать в расписание!</h2>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            Здесь вы можете планировать свои занятия, открывать новые слоты для бронирования и управлять существующими уроками. Ученики смогут бронировать только свободные ("Open") слоты.
          </p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block">
          <CalendarRange size={120} className="text-indigo-400" />
        </div>
      </div>

      {/* Guide Card */}
      <div className="flex gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-sm text-slate-400">
        <Info className="text-indigo-400 flex-shrink-0" size={18} />
        <p>
          <span className="font-semibold text-slate-300">Как создать слот:</span> Зажмите и перетащите мышь по календарной сетке (доступно в режимах Неделя/День), чтобы задать время, либо просто кликните на пустое место.
        </p>
      </div>

      {/* Interactive Calendar Component */}
      <Calendar />
    </div>
  );
}
