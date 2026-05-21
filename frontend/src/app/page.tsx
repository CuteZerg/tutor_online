import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navigation / Header */}
      <header className="absolute top-0 w-full p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            T
          </div>
          <span className="text-xl font-semibold tracking-tight">TutorOnline</span>
        </div>
        <Link 
          href="/auth/login"
          className="px-5 py-2.5 text-sm font-medium rounded-full bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
        >
          Вход для клиентов
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-12 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[400px] bg-violet-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1]">
            Ваш личный кабинет <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">
              для изучения информатики
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
            Интерактивные занятия, встроенный редактор кода, управление расписанием и умные уведомления — всё в одном месте для максимальной эффективности обучения.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
            <Link 
              href="/auth/login"
              className="px-8 py-4 text-base font-medium rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto"
            >
              Войти в личный кабинет
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-6xl mx-auto w-full">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group flex flex-col p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${feature.color} bg-opacity-10 shadow-inner`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-200">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const features = [
  {
    title: "Интерактивная комната",
    description: "Встроенная WebRTC видеосвязь и виртуальная доска (whiteboard) для совместной работы в реальном времени.",
    color: "from-blue-500/20 to-indigo-500/20 text-indigo-400",
    icon: (
      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: "Среда программирования",
    description: "Проверка домашних заданий через встроенный редактор кода с подсветкой синтаксиса для Python.",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400",
    icon: (
      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )
  },
  {
    title: "Умное расписание",
    description: "Интерактивный календарь занятий, отслеживание баланса оплат и удобная система переноса уроков.",
    color: "from-violet-500/20 to-purple-500/20 text-violet-400",
    icon: (
      <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
];
