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

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-2xl border border-slate-700">
        <button
          onClick={() => {
            canvasRef.current?.eraseMode(false);
            setEraseMode(false);
          }}
          className={`p-2 rounded-xl transition-colors ${!eraseMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          title="Карандаш"
        >
          <Pen size={20} />
        </button>
        <button
          onClick={() => {
            canvasRef.current?.eraseMode(true);
            setEraseMode(true);
          }}
          className={`p-2 rounded-xl transition-colors ${eraseMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          title="Ластик"
        >
          <Eraser size={20} />
        </button>
        
        <div className="h-6 w-px bg-slate-700 mx-2"></div>
        
        {/* Colors */}
        {['#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'].map(color => (
          <button
            key={color}
            onClick={() => setStrokeColor(color)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${strokeColor === color && !eraseMode ? 'scale-125 border-slate-300' : 'border-transparent'}`}
            style={{ backgroundColor: color }}
          />
        ))}

        <div className="flex-1"></div>

        <button
          onClick={handleClear}
          className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors flex items-center gap-2"
        >
          <Trash2 size={20} />
          <span className="text-sm font-semibold">Очистить</span>
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
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
