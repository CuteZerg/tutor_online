'use client';

import React, { useState } from 'react';
import { BookOpen, Code, Terminal, Database, Copy, Check, Search, Sparkles } from 'lucide-react';

interface MaterialItem {
  id: string;
  title: string;
  category: 'python' | 'git' | 'sql';
  description: string;
  code: string;
}

const MATERIALS_DATA: MaterialItem[] = [
  {
    id: 'py-loop',
    title: 'Циклы и переборы в Python',
    category: 'python',
    description: 'Использование циклов for и while, а также генераторов списков (list comprehensions) для лаконичного кода.',
    code: `# Обычный цикл с условием
numbers = [1, 2, 3, 4, 5]
squares = []
for n in numbers:
    if n % 2 != 0:
        squares.append(n ** 2)

# Эквивалентный генератор списка (List Comprehension)
squares_cool = [n ** 2 for n in numbers if n % 2 != 0]
print(squares_cool) # [1, 9, 25]`
  },
  {
    id: 'py-func',
    title: 'Декораторы и именованные аргументы',
    category: 'python',
    description: 'Определение функций с произвольным числом аргументов (*args, **kwargs) и базовый декоратор замера времени выполнения.',
    code: `import time

def timing_decorator(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"Функция {func.__name__} выполнена за {end - start:.4f} сек")
        return result
    return wrapper

@timing_decorator
def calculate_heavy_sum(n):
    return sum(i * i for i in range(n))

calculate_heavy_sum(1000000)`
  },
  {
    id: 'git-commit',
    title: 'Стандартный рабочий процесс Git',
    category: 'git',
    description: 'Основные команды для фиксации изменений и отправки их в удаленный репозиторий GitHub/GitLab.',
    code: `# 1. Проверить измененные файлы
git status

# 2. Добавить все изменения в индекс
git add .

# 3. Зафиксировать изменения с понятным сообщением (по Conventional Commits)
git commit -m "feat(auth): реализовать ролевую авторизацию пользователей"

# 4. Отправить изменения в ветку dev
git push origin dev`
  },
  {
    id: 'git-branch',
    title: 'Управление ветками и слияния',
    category: 'git',
    description: 'Создание новых веток, переключение между ними и безопасное слияние с главной веткой.',
    code: `# Создать новую ветку фичи и сразу переключиться на нее
git checkout -b feature/jwt-tokens

# Посмотреть список всех локальных веток
git branch

# Вернуться на главную ветку
git checkout main

# Слить ветку фичи в текущую ветку (main)
git merge feature/jwt-tokens

# Удалить ветку фичи после успешного слияния
git branch -d feature/jwt-tokens`
  },
  {
    id: 'sql-join',
    title: 'Связывание таблиц (INNER / LEFT JOIN)',
    category: 'sql',
    description: 'Связывание таблиц пользователей и их уроков для получения сводных отчетов по обучению.',
    code: `-- Получить список уроков с именами студентов и преподавателей
SELECT 
    l.id AS lesson_id,
    l.title AS lesson_title,
    s.full_name AS student_name,
    t.full_name AS tutor_name,
    l.price AS lesson_price
FROM lessons l
INNER JOIN users s ON l.student_id = s.id
INNER JOIN users t ON l.tutor_id = t.id
WHERE l.status = 'scheduled'
ORDER BY l.start_time ASC;`
  },
  {
    id: 'sql-group',
    title: 'Агрегация и Группировка данных',
    category: 'sql',
    description: 'Подсчет общего объема оплат и среднего чека за проведенные уроки по каждому студенту.',
    code: `-- Посчитать сумму расходов и количество уроков для каждого ученика
SELECT 
    s.id AS student_id,
    s.full_name AS student_name,
    COUNT(l.id) AS total_lessons,
    SUM(l.price) AS total_spent,
    AVG(l.price) AS average_lesson_cost
FROM users s
INNER JOIN lessons l ON s.id = l.student_id
WHERE l.status = 'completed'
GROUP BY s.id, s.full_name
HAVING SUM(l.price) > 5000
ORDER BY total_spent DESC;`
  }
];

export default function StudentMaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'python' | 'git' | 'sql'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const filteredMaterials = MATERIALS_DATA.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-br from-indigo-900/35 to-violet-900/25 border border-indigo-500/10 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-slate-100 mb-2 tracking-tight flex items-center gap-3 select-none">
            <BookOpen className="text-indigo-400" />
            Библиотека знаний и шпаргалок 📚
          </h2>
          <p className="text-slate-400 max-w-2xl leading-relaxed text-sm">
            Интерактивный справочник полезного кода, алгоритмических конструкций и команд. Используйте эти готовые шаблоны для выполнения ваших домашних заданий и решения практических задач на уроках!
          </p>
        </div>
      </div>

      {/* Filters & Search Control */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по теме или коду..."
            className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl pl-11 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm font-semibold backdrop-blur-xl"
          />
        </div>

        {/* Categories Tab Switches */}
        <div className="flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/60 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Все темы' },
            { id: 'python', label: 'Python', icon: Code },
            { id: 'git', label: 'Git Bash', icon: Terminal },
            { id: 'sql', label: 'SQL БД', icon: Database },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {Icon && <Icon size={14} />}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Materials List */}
      <div className="grid grid-cols-1 gap-8">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <div 
                key={item.id} 
                className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl shadow-xl flex flex-col space-y-4 hover:border-slate-800 transition-all duration-300 relative group overflow-hidden"
              >
                {/* Visual Glow */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-500" />
                
                {/* Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        item.category === 'python' 
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
                          : item.category === 'git'
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.category === 'python' ? 'Python' : item.category === 'git' ? 'Git' : 'SQL'}
                      </span>
                      <span className="text-slate-600 text-[10px] font-mono">ID: {item.id}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-100 group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopy(item.code, item.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto border ${
                      isCopied 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        Скопировано!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Копировать код
                      </>
                    )}
                  </button>
                </div>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed max-w-4xl select-none">
                  {item.description}
                </p>

                {/* Code Window Container */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                  {/* Window Bar */}
                  <div className="bg-slate-950 border-b border-slate-900 px-4 py-3 flex items-center justify-between select-none">
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 font-bold uppercase tracking-wider">
                      {item.category === 'python' ? 'main.py' : item.category === 'git' ? 'terminal.sh' : 'query.sql'}
                    </span>
                  </div>
                  
                  {/* Code Block */}
                  <pre className="p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[300px]">
                    <code>{item.code}</code>
                  </pre>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-3xl bg-slate-900/15 border border-slate-800/40 text-slate-500 flex flex-col items-center justify-center gap-3">
            <Search size={36} className="text-slate-800 mb-1" />
            <p className="text-sm font-medium">Ничего не найдено</p>
            <p className="text-xs text-slate-600">
              Попробуйте изменить поисковый запрос или переключить категорию.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
