'use client';

import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { api } from '@/lib/api';
import { Play, PlayCircle, Loader2, Code, Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CodeEditorProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ 
  initialCode = '# Напишите свой код на Python здесь\nprint("Hello, TutorOnline!")\n', 
  onCodeChange,
  readOnly = false 
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ stdout: string; stderr: string; exit_code: number } | null>(null);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      if (onCodeChange) {
        onCodeChange(value);
      }
    }
  };

  const handleRunCode = async () => {
    setRunning(true);
    try {
      const response = await api.post('/homeworks/run', { code });
      setOutput(response.data);
    } catch (err) {
      setOutput({
        stdout: '',
        stderr: 'Ошибка сети при попытке выполнить код.',
        exit_code: -1,
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Code className="text-indigo-400" size={20} />
          <span className="font-semibold text-slate-200">Редактор кода Python</span>
        </div>
        {!readOnly && (
          <button
            onClick={handleRunCode}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] shadow-lg shadow-indigo-600/10 active:scale-[0.98]"
          >
            {running ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Выполняется...
              </>
            ) : (
              <>
                <Play size={16} />
                Запустить код
              </>
            )}
          </button>
        )}
      </div>

      {/* Editor Main Section */}
      <div className="flex-1 grid grid-rows-2 md:grid-rows-1 md:grid-cols-3 min-h-[400px]">
        {/* Editor (2/3 width on wide screens) */}
        <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-slate-800 h-full">
          <MonacoEditor
            height="100%"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{
              readOnly: readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'Fira Code, Menlo, Monaco, Consolas, Courier New, monospace',
              automaticLayout: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              lineHeight: 22,
              padding: { top: 16 },
            }}
          />
        </div>

        {/* Terminal/Output (1/3 width) */}
        <div className="flex flex-col bg-slate-900 h-full">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-900/50">
            <Terminal className="text-slate-400" size={16} />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Вывод консоли</span>
          </div>

          <div className="flex-1 p-6 font-mono text-sm overflow-y-auto bg-slate-950 text-slate-300">
            {running && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
                <span>Выполнение на удаленном сервере...</span>
              </div>
            )}

            {!running && !output && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center gap-3">
                <PlayCircle size={32} className="text-slate-600" />
                <span className="max-w-[200px] leading-relaxed">Нажмите кнопку «Запустить код», чтобы увидеть результат выполнения программы.</span>
              </div>
            )}

            {!running && output && (
              <div className="space-y-4">
                {output.stdout && (
                  <div>
                    <div className="text-xs text-slate-500 font-semibold mb-1">STDOUT:</div>
                    <pre className="whitespace-pre-wrap text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl">{output.stdout}</pre>
                  </div>
                )}
                {output.stderr && (
                  <div>
                    <div className="text-xs text-slate-500 font-semibold mb-1">STDERR:</div>
                    <pre className="whitespace-pre-wrap text-rose-400 bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl">{output.stderr}</pre>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs font-semibold">
                  {output.exit_code === 0 ? (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 size={14} />
                      Выполнено успешно (код 0)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <AlertTriangle size={14} />
                      Завершено с ошибкой (код {output.exit_code})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
