'use client';

import React from 'react';
import Calendar from '@/components/calendar/Calendar';
import { CalendarRange } from 'lucide-react';

export default function ParentSchedulePage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Page Description */}
      <div>
        <h2 className="text-2xl font-black text-slate-100 mb-2">Календарь занятий ребенка</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Интерактивный календарь с расписанием уроков ваших детей. Вы можете наглядно контролировать время проведения занятий и их статусы.
        </p>
      </div>

      {/* Calendar container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between select-none">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CalendarRange className="text-indigo-400" size={20} />
            Интерактивный мониторинг уроков
          </h3>
          <span className="text-xs text-slate-500 font-medium">Режим просмотра занятий</span>
        </div>

        <Calendar />
      </div>
    </div>
  );
}
