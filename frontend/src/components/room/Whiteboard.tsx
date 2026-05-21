'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { useDataChannel } from '@livekit/components-react';
import { Eraser, Pen, Trash2, Undo } from 'lucide-react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function Whiteboard() {
  const { id } = useParams();
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [eraseMode, setEraseMode] = useState(false);
  
  // WebRTC DataChannel for broadcasting pings
  const { send, message } = useDataChannel('whiteboard');

  // Fetch initial paths
  const fetchPaths = async () => {
    try {
      const res = await api.get(`/room/${id}/whiteboard`);
      if (res.data && res.data.paths && canvasRef.current) {
        canvasRef.current.loadPaths(res.data.paths);
      }
    } catch (err) {
      console.error('Failed to fetch whiteboard paths', err);
    }
  };

  useEffect(() => {
    fetchPaths();
  }, [id]);

  useEffect(() => {
    if (message) {
      try {
        const data = JSON.parse(new TextDecoder().decode(message.payload));
        if (data.type === 'update' || data.type === 'undo') {
          // A peer updated the whiteboard, fetch latest state from server
          fetchPaths();
        } else if (data.type === 'clear' && canvasRef.current) {
          canvasRef.current.clearCanvas();
        }
      } catch(e) {
        console.error('Error parsing whiteboard ping', e);
      }
    }
  }, [message]);

  const pingUpdate = async (type: string = 'update') => {
    const msg = JSON.stringify({ type });
    await send(new TextEncoder().encode(msg), { reliable: true });
  };

  const handleClear = async () => {
    canvasRef.current?.clearCanvas();
    try {
      await api.delete(`/room/${id}/whiteboard`);
      pingUpdate('clear');
    } catch (e) {
      console.error(e);
    }
  };

  const handleUndo = async () => {
    canvasRef.current?.undo();
    // After undo, export the current paths and save to server
    canvasRef.current?.exportPaths().then(async (paths) => {
      try {
        await api.post(`/room/${id}/whiteboard`, paths);
        pingUpdate('undo');
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleDrawEnd = () => {
    canvasRef.current?.exportPaths().then(async (paths) => {
      try {
        await api.post(`/room/${id}/whiteboard`, paths);
        pingUpdate('update');
      } catch (e) {
        console.error(e);
      }
    });
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-700 bg-white shadow-inner flex flex-col">
      {/* Top Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2 rounded-2xl flex items-center gap-2 shadow-2xl z-20">
        <button 
          onClick={() => setEraseMode(false)}
          className={`p-3 rounded-xl transition-all cursor-pointer ${!eraseMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          title="Карандаш"
        >
          <Pen size={18} />
        </button>
        <button 
          onClick={() => setEraseMode(true)}
          className={`p-3 rounded-xl transition-all cursor-pointer ${eraseMode ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
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

      <div className="flex-1 bg-[#1e293b] min-h-0 relative" onPointerUp={handleDrawEnd}>
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={4}
          eraserWidth={20}
          strokeColor={strokeColor}
          canvasColor="transparent"
          className="!border-none w-full h-full"
        />
      </div>
    </div>
  );
}
