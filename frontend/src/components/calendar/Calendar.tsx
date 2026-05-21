'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api, getWsUrl } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Plus, X, Calendar as CalendarIcon, Clock, DollarSign, Tag, User, ChevronLeft, ChevronRight } from 'lucide-react';
import Cookies from 'js-cookie';

const locales = {
  'ru': ru,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Lesson {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  price: number;
  status: 'open' | 'pending' | 'scheduled' | 'completed' | 'cancelled';
  tutor_id: number;
  student_id: number | null;
}

interface CalendarProps {
  onLessonBooked?: () => void;
}

export default function Calendar({ onLessonBooked }: CalendarProps) {
  const { user, fetchUser } = useAuthStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Lesson | null>(null);

  const isRoomActive = (lesson: Lesson) => {
    const now = new Date().getTime();
    const startTime = new Date(lesson.start_time).getTime();
    const endTime = new Date(lesson.end_time).getTime();
    const fifteenMins = 15 * 60 * 1000;
    return now >= (startTime - fifteenMins) && now <= endTime;
  };

  // Controlled Calendar View & Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<any>(Views.WEEK);
  
  // Create Slot Form State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [price, setPrice] = useState('1500');
  const [studentId, setStudentId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);

  const fetchLessons = async () => {
    try {
      const res = await api.get('/lessons/');
      setLessons(res.data);
    } catch (err) {
      console.error('Failed to fetch lessons', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (user?.role === 'tutor') {
      try {
        const res = await api.get('/users/');
        setStudents(res.data.filter((u: any) => u.role === 'student'));
      } catch (err) {}
    }
  };

  useEffect(() => {
    fetchLessons();
    
    // WebSocket Real-time Updates
    const token = Cookies.get('access_token');
    const wsUrl = getWsUrl(`/ws/?token=${token}`);
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      if (event.data === 'REFRESH') {
        fetchLessons();
        if (fetchUser) fetchUser();
        if (onLessonBooked) onLessonBooked();
      }
    };
    
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.resource);
    setModalOpen(true);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (user?.role !== 'tutor') return;
    
    const dateStr = format(start, 'dd.MM.yyyy');
    const startStr = format(start, 'HH:mm');
    const endStr = format(end, 'HH:mm');
    
    setStartDate(dateStr);
    setStartTime(startStr);
    setEndTime(endStr);
    setTitle('Занятие по информатике');
    setPrice('1500');
    setStudentId('');
    setCreateModalOpen(true);
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !startTime || !endTime) return;

    try {
      // Parse dd.mm.yyyy HH:mm
      const parsedDate = parse(startDate, 'dd.MM.yyyy', new Date());
      const startDateTime = parse(startTime, 'HH:mm', parsedDate);
      const endDateTime = parse(endTime, 'HH:mm', parsedDate);

      const payload: any = {
        title: title || 'Занятие по информатике',
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        price: parseInt(price, 10),
      };

      if (studentId) {
        payload.student_id = parseInt(studentId, 10);
      }

      await api.post('/lessons/', payload);

      setCreateModalOpen(false);
      fetchLessons();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Ошибка при создании слота';
      alert(errMsg);
    }
  };

  const handleBookLesson = async (lessonId: number) => {
    try {
      await api.patch(`/lessons/${lessonId}`, {
        status: 'scheduled',
      });
      setModalOpen(false);
      fetchLessons();
      // Instantly update student's profile & balance on dashboard
      if (fetchUser) {
        await fetchUser();
      }
      if (onLessonBooked) {
        onLessonBooked();
      }
      alert('Занятие успешно забронировано!');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Ошибка при бронировании занятия';
      alert(errMsg);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот слот?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      setModalOpen(false);
      fetchLessons();
    } catch (err) {
      alert('Ошибка при удалении слота');
    }
  };

  const handleCopyWeek = async () => {
    if (!confirm('Скопировать расписание видимой в календаре недели на следующую неделю?')) return;
    try {
      await api.post('/lessons/copy-week', { date: currentDate.toISOString() });
      fetchLessons();
      alert('Расписание успешно скопировано!');
    } catch (err) {
      alert('Ошибка при копировании расписания');
    }
  };

  const events = lessons.map(lesson => ({
    id: lesson.id,
    title: lesson.title || 'Занятие',
    start: new Date(lesson.start_time),
    end: new Date(lesson.end_time),
    resource: lesson,
  }));

  const eventPropGetter = (event: any) => {
    const status = event.resource.status;
    
    let backgroundColor = 'transparent';
    let borderColor = 'transparent';
    let color = '#fff';

    if (status === 'open') {
      backgroundColor = 'rgba(16, 185, 129, 0.2)';
      borderColor = 'rgba(16, 185, 129, 0.4)';
      color = '#6ee7b7';
    } else if (status === 'scheduled') {
      backgroundColor = 'rgba(99, 102, 241, 0.2)';
      borderColor = 'rgba(99, 102, 241, 0.4)';
      color = '#a5b4fc';
    } else if (status === 'pending') {
      backgroundColor = 'rgba(245, 158, 11, 0.2)';
      borderColor = 'rgba(245, 158, 11, 0.4)';
      color = '#fcd34d';
    } else if (status === 'completed') {
      backgroundColor = 'rgba(100, 116, 139, 0.2)';
      borderColor = 'rgba(100, 116, 139, 0.4)';
      color = '#cbd5e1';
    } else {
      backgroundColor = 'rgba(244, 63, 94, 0.2)';
      borderColor = 'rgba(244, 63, 94, 0.4)';
      color = '#fda4af';
    }

    return {
      className: `rounded-xl px-3 py-1 text-xs font-medium cursor-pointer transition-all duration-300 ease-in-out`,
      style: {
        backgroundColor,
        borderColor,
        color,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '10px',
      }
    };
  };

  // 24h & Russian Formatter Config
  const formats = {
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: ({ start, end }: any, culture: any, localizer: any) =>
      `${localizer.format(start, 'HH:mm', culture)} — ${localizer.format(end, 'HH:mm', culture)}`,
    dayHeaderFormat: 'dd.MM.yyyy',
    dayRangeHeaderFormat: ({ start, end }: any, culture: any, localizer: any) =>
      `${localizer.format(start, 'dd.MM.yyyy', culture)} — ${localizer.format(end, 'dd.MM.yyyy', culture)}`,
    dayFormat: 'dd.MM EEE',
    monthHeaderFormat: 'LLLL yyyy',
  };

  // Glassmorphic Custom Russian Toolbar
  const CustomToolbar = (toolbarProps: any) => {
    const { label, date, view, onView, onNavigate } = toolbarProps;

    const getCustomLabel = () => {
      if (view === 'month') {
        return format(date, 'LLLL yyyy', { locale: ru });
      } else if (view === 'week') {
        const start = startOfWeek(date, { weekStartsOn: 1 });
        const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
        return `${format(start, 'dd.MM.yyyy')} — ${format(end, 'dd.MM.yyyy')}`;
      } else {
        return format(date, 'dd.MM.yyyy (EEEE)', { locale: ru });
      }
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('TODAY')}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Сегодня
          </button>
          {user?.role === 'tutor' && (
            <button
              type="button"
              onClick={handleCopyWeek}
              className="px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Копировать расписание
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('PREV')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Назад"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Вперед"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Date Label */}
        <h3 className="text-lg font-bold text-slate-100 capitalize tracking-wide select-none">
          {getCustomLabel()}
        </h3>

        {/* View Switching */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/60">
          {[
            { id: 'month', label: 'Месяц' },
            { id: 'week', label: 'Неделя' },
            { id: 'day', label: 'День' },
          ].map((v) => {
            const isActive = view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onView(v.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Restrict calendar display hours: 00:00 - 23:59
  const minTime = new Date(2026, 0, 1, 0, 0, 0);
  const maxTime = new Date(2026, 0, 1, 23, 59, 59);

  return (
    <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl h-[650px] shadow-2xl relative">
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            onNavigate={setCurrentDate}
            view={currentView}
            onView={setCurrentView}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable={user?.role === 'tutor'}
            eventPropGetter={eventPropGetter}
            culture="ru"
            formats={formats}
            components={{
              toolbar: CustomToolbar
            }}
            messages={{
              next: 'Вперед',
              previous: 'Назад',
              today: 'Сегодня',
              month: 'Месяц',
              week: 'Неделя',
              day: 'День',
            }}
            min={minTime}
            max={maxTime}
            className="text-slate-200 custom-calendar font-sans"
          />

          {/* Premium custom stylesheet overrides for react-big-calendar */}
          <style>{`
            .custom-calendar .rbc-time-view, 
            .custom-calendar .rbc-month-view {
              border: 1px solid rgba(51, 65, 85, 0.25) !important;
              background-color: rgba(15, 23, 42, 0.15);
              border-radius: 20px;
              overflow: hidden;
            }
            .custom-calendar .rbc-header {
              border-bottom: 1px solid rgba(51, 65, 85, 0.25) !important;
              padding: 12px 6px !important;
              font-weight: 700 !important;
              color: #cbd5e1 !important;
              text-transform: capitalize;
              font-size: 13px;
            }
            .custom-calendar .rbc-header + .custom-calendar .rbc-header {
              border-left: 1px solid rgba(51, 65, 85, 0.25) !important;
            }
            .custom-calendar .rbc-time-header-content {
              border-left: 1px solid rgba(51, 65, 85, 0.25) !important;
            }
            .custom-calendar .rbc-time-content {
              border-top: 1px solid rgba(51, 65, 85, 0.25) !important;
            }
            .custom-calendar .rbc-time-gutter {
              color: #64748b !important;
              font-size: 11px !important;
              font-weight: 700 !important;
              padding-top: 4px;
            }
            .custom-calendar .rbc-timeslot-group {
              border-bottom: 1px solid rgba(51, 65, 85, 0.15) !important;
              min-height: 48px;
            }
            .custom-calendar .rbc-day-slot .rbc-time-slot {
              border-top: 1px solid rgba(51, 65, 85, 0.05) !important;
            }
            .custom-calendar .rbc-day-bg + .custom-calendar .rbc-day-bg {
              border-left: 1px solid rgba(51, 65, 85, 0.25) !important;
            }
            .custom-calendar .rbc-time-column {
              border-left: 1px solid rgba(51, 65, 85, 0.25) !important;
            }
            .custom-calendar .rbc-today {
              background-color: rgba(99, 102, 241, 0.03) !important;
            }
            .custom-calendar .rbc-event {
              padding: 2px 4px !important;
              border-radius: 10px !important;
              overflow: hidden;
              background-color: transparent !important;
            }
            .custom-calendar .rbc-event-content {
              font-size: 11px;
              line-height: 1.3;
            }
            .custom-calendar .rbc-label {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
            }
            .custom-calendar .rbc-time-view .rbc-allday-cell {
              display: none; /* Hide all-day row since we only have hourly lessons */
            }
          `}</style>
        </>
      )}

      {/* Booking / Details Modal */}
      {modalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full relative shadow-2xl mx-4">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
              <CalendarIcon className="text-indigo-400" />
              Детали занятия
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-slate-300">
                <Tag size={18} className="text-slate-400" />
                <span className="font-medium">{selectedEvent.title || 'Занятие по информатике'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Clock size={18} className="text-slate-400" />
                <span>
                  {format(new Date(selectedEvent.start_time), 'dd.MM.yyyy')} с{' '}
                  {format(new Date(selectedEvent.start_time), 'HH:mm')} до{' '}
                  {format(new Date(selectedEvent.end_time), 'HH:mm')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <DollarSign size={18} className="text-slate-400" />
                <span>{selectedEvent.price.toLocaleString()} ₽</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <User size={18} className="text-slate-400" />
                <span className="capitalize">
                  Статус:{' '}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedEvent.status === 'open' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {selectedEvent.status === 'open' ? 'Свободно' : 'Забронировано'}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              {user?.role === 'student' && selectedEvent.status === 'open' && (
                <button
                  onClick={() => handleBookLesson(selectedEvent.id)}
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer text-center"
                >
                  Забронировать
                </button>
              )}
              {selectedEvent.status === 'scheduled' && (
                <a
                  href={isRoomActive(selectedEvent) ? `/room/${selectedEvent.id}` : '#'}
                  onClick={(e) => { if (!isRoomActive(selectedEvent)) e.preventDefault(); }}
                  className={`flex-1 py-3.5 rounded-2xl font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center ${
                    isRoomActive(selectedEvent) 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02]' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isRoomActive(selectedEvent) ? 'Войти в класс' : 'Ждите начала (15 мин)'}
                </a>
              )}
              {selectedEvent.status === 'pending' && user?.role === 'tutor' && (
                <div className="flex-1 py-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl font-semibold text-center flex items-center justify-center cursor-default">
                  Ожидает подтверждения учеником
                </div>
              )}
              {user?.role === 'tutor' && (
                <button
                  onClick={() => handleDeleteLesson(selectedEvent.id)}
                  className="flex-1 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl font-semibold hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                >
                  Удалить слот
                </button>
              )}
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-semibold transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Slot Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <form 
            onSubmit={handleCreateSlot}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full relative shadow-2xl mx-4"
          >
            <button 
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
              <Plus className="text-emerald-400" />
              Добавить слот занятий
            </h3>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Название</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="Занятие по информатике"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Дата (ДД.ММ.ГГГГ)</label>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="21.05.2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Ученик (опционально)</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="">(Не выбран - открытый слот)</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Начало (ЧЧ:ММ)</label>
                  <input
                     type="text"
                     placeholder="16:00"
                     value={startTime}
                     onChange={(e) => setStartTime(e.target.value)}
                     className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                     required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Конец (ЧЧ:ММ)</label>
                  <input
                    type="text"
                    placeholder="21:00"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Стоимость (₽)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                Создать
              </button>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-semibold transition-colors cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
