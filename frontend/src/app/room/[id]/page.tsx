'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  ControlBar, 
  GridLayout, 
  ParticipantTile, 
  useTracks
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { api } from '@/lib/api';
import Whiteboard from '@/components/room/Whiteboard';

// Custom component to render the video grid
function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

import { useAuthStore } from '@/store/authStore';

export default function RoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch config to get LIVEKIT_URL
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        setServerUrl(data.livekitUrl);
      } catch (err) {
        setServerUrl('wss://tutoronline-rb4lztss.livekit.cloud');
      }
    };

    // 2. Fetch connection token
    const fetchToken = async () => {
      try {
        const res = await api.get(`/room/${id}/token`);
        setToken(res.data.token);
      } catch (err) {
        console.error('Failed to get token', err);
        alert('Ошибка при подключении к классу. Возможно класс еще не создан или у вас нет доступа.');
        router.push('/');
      }
    };

    Promise.all([fetchConfig(), fetchToken()]).finally(() => {
      setLoading(false);
    });
  }, [id, router]);

  if (loading || !token || !serverUrl) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-semibold animate-pulse">Подключение к занятию...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      className="flex w-full h-screen bg-slate-950 text-white overflow-hidden font-sans"
    >
      {/* Left Area: Whiteboard */}
      <div className="flex-1 flex flex-col border-r border-slate-800 shadow-2xl z-10">
        <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            Интерактивный класс
          </h1>
          <button 
            onClick={() => router.push(`/${user?.role === 'tutor' ? 'tutor' : 'student'}`)} 
            className="px-5 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-semibold hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            Покинуть класс
          </button>
        </div>
        <div className="flex-1 p-6 bg-slate-900/50">
          <Whiteboard />
        </div>
      </div>

      {/* Right Area: Video grid and controls */}
      <div className="w-[420px] flex flex-col h-full relative bg-slate-950 z-20">
        <div className="flex-1 overflow-hidden p-4">
          <VideoGrid />
        </div>
        
        {/* LiveKit Default ControlBar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
          <ControlBar variation="minimal" />
        </div>
      </div>
      
      {/* Audio component is required to hear other participants */}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
