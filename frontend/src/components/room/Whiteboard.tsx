'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { useDataChannel } from '@livekit/components-react';
import { Eraser, Pen, Trash2 } from 'lucide-react';

export default function Whiteboard() {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [eraseMode, setEraseMode] = useState(false);
  
  // WebRTC DataChannel for broadcasting strokes
  const { send, message } = useDataChannel('whiteboard');

  useEffect(() => {
    if (message) {
      try {
        const data = JSON.parse(new TextDecoder().decode(message.payload));
        if (data.type === 'paths' && canvasRef.current) {
          canvasRef.current.loadPaths(data.paths);
        } else if (data.type === 'clear' && canvasRef.current) {
          canvasRef.current.clearCanvas();
        }
      } catch(e) {
        console.error('Error parsing whiteboard data', e);
      }
    }
  }, [message]);

  const handleChange = async (updatedPaths: any) => {
    // Broadcast paths to everyone in the room
    const msg = JSON.stringify({ type: 'paths', paths: updatedPaths });
    await send(new TextEncoder().encode(msg), { reliable: true });
  };

  const handleClear = async () => {
    canvasRef.current?.clearCanvas();
    const msg = JSON.stringify({ type: 'clear' });
    await send(new TextEncoder().encode(msg), { reliable: true });
  };

  const handleUndo = async () => {
    canvasRef.current?.undo();
    const msg = JSON.stringify({ type: 'undo' });
    await send(new TextEncoder().encode(msg), { reliable: true });
  };

  const handleDrawEnd = () => {
    canvasRef.current?.exportPaths().then(paths => {
      handleChange(paths);
    });
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-700 bg-white shadow-inner flex flex-col">
      {/* Top Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2 rounded-2xl flex items-center gap-2 shadow-2xl z-20">
        <button 
          onClick={() => setEraserMode(false)}
          className={`p-3 rounded-xl transition-all cursor-pointer ${!eraserMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          title="Карандаш"
        >
          <Pen size={18} />
        </button>
        <button 
          onClick={() => setEraserMode(true)}
          className={`p-3 rounded-xl transition-all cursor-pointer ${eraserMode ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          title="Ластик"
        >
          <Eraser size={18} />
        </button>
        <div className="w-[1px] h-6 bg-slate-700 mx-1"></div>
        <button 
          onClick={handleUndo}
          className="p-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
          title="Отменить"
        >
          <Undo size={18} />
        </button>
        <button 
          onClick={handleClear}
          className="p-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          title="Очистить доску"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 bg-[#1e293b]" onPointerUp={handleDrawEnd}>
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={4}
          eraserWidth={20}
          strokeColor={strokeColor}
          canvasColor="transparent"
          onChange={handleChange}
          className="!border-none"
        />
      </div>
    </div>
  );
}
