'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import CodeEditor from '@/components/editor/CodeEditor';
import { BookOpen, Calendar, Award, MessageSquare, CheckCircle, Clock, AlertCircle, Sparkles, Send } from 'lucide-react';

interface Homework {
  id: number;
  lesson_id: number;
  description: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'graded';
  student_code: string | null;
  grade: number | null;
  feedback: string | null;
}

export default function StudentHomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHomeworks = async () => {
    try {
      const response = await api.get('/homeworks/');
      setHomeworks(response.data);
      if (response.data.length > 0) {
        setSelectedHomework(response.data[0]);
        setCode(response.data[0].student_code || '# Напишите свой код на Python здесь\n');
      }
    } catch (err) {
      console.error('Failed to fetch homeworks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const handleSelectHomework = (hw: Homework) => {
    setSelectedHomework(hw);
    setCode(hw.student_code || '# Напишите свой код на Python здесь\n');
  };

  const handleSubmitHomework = async () => {
    if (!selectedHomework) return;
    setSubmitting(true);
    try {
      await api.patch(`/homeworks/${selectedHomework.id}`, {
        student_code: code,
        status: 'submitted',
      });
      alert('Домашнее задание успешно отправлено!');
      fetchHomeworks();
    } catch (err) {
      alert('Ошибка при отправке домашнего задания.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle size={12} />
            Оценено
          </span>
        );
      case 'submitted':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <Clock size={12} />
            На проверке
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle size={12} />
            Ожидает
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
      {/* Sidebar - Task List */}
      <div className="lg:col-span-1 space-y-4 flex flex-col">
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="text-indigo-400" size={20} />
          Список заданий
        </h3>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-900/40 rounded-3xl border border-slate-800">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : homeworks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-500 gap-3">
            <Sparkles size={32} className="text-slate-700" />
            <span>У вас пока нет назначенных домашних заданий!</span>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto flex-1 max-h-[600px] pr-2">
            {homeworks.map((hw) => (
              <button
                key={hw.id}
                onClick={() => handleSelectHomework(hw)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${
                  selectedHomework?.id === hw.id
                    ? 'bg-indigo-600/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="font-semibold text-slate-200 line-clamp-1">Задание #{hw.id}</span>
                  {getStatusBadge(hw.status)}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{hw.description}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Calendar size={12} />
                  <span>Сдать до: {new Date(hw.due_date).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Workspace - Code Editor & feedback */}
      <div className="lg:col-span-2 space-y-6 flex flex-col">
        {selectedHomework ? (
          <>
            {/* Task Info Panel */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl">
              <h4 className="text-lg font-bold text-slate-100 mb-2">Описание задания:</h4>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">{selectedHomework.description}</p>
              
              {/* Grade & Feedback section */}
              {selectedHomework.status === 'graded' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800/60 pt-6">
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                    <Award className="text-emerald-400" size={24} />
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Оценка:</div>
                      <div className="text-lg font-extrabold text-emerald-400">{selectedHomework.grade} / 100</div>
                    </div>
                  </div>
                  <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-start gap-3">
                    <MessageSquare className="text-indigo-400 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-0.5">Отзыв преподавателя:</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedHomework.feedback || 'Нет комментариев.'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Monaco Workspace */}
            <div className="flex-1 flex flex-col h-[500px]">
              <CodeEditor 
                initialCode={code} 
                onCodeChange={setCode}
                readOnly={selectedHomework.status === 'graded'}
              />
            </div>

            {/* Action Bar */}
            {selectedHomework.status !== 'graded' && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSubmitHomework}
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-indigo-600/10 active:scale-[0.98]"
                >
                  <Send size={18} />
                  {submitting ? 'Отправка...' : 'Отправить решение преподавателю'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/20 border border-slate-800/40 rounded-3xl text-slate-500 text-center gap-3">
            <BookOpen size={48} className="text-slate-700" />
            <span>Выберите задание слева, чтобы начать работу в редакторе кода.</span>
          </div>
        )}
      </div>
    </div>
  );
}
