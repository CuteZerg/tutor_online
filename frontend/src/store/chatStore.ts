import { create } from 'zustand';
import { api } from '@/lib/api';

interface ChatStore {
  unreadTotal: number;
  setUnreadTotal: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: (count: number) => void;
  fetchUnreadTotal: () => Promise<void>;
  ws: WebSocket | null;
  connectWs: (token: string) => void;
  disconnectWs: () => void;
  lastEvent: { type: string; payload: any; timestamp: number } | null;
  setLastEvent: (type: string, payload: any) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  unreadTotal: 0,
  setUnreadTotal: (count) => set({ unreadTotal: count }),
  incrementUnread: () => set((state) => ({ unreadTotal: state.unreadTotal + 1 })),
  decrementUnread: (count) => set((state) => ({ unreadTotal: Math.max(0, state.unreadTotal - count) })),
  ws: null,
  lastEvent: null,
  setLastEvent: (type, payload) => set({ lastEvent: { type, payload, timestamp: Date.now() } }),
  
  fetchUnreadTotal: async () => {
    try {
      const res = await api.get('/chat/contacts');
      const total = res.data.reduce((sum: number, contact: any) => sum + contact.unread_count, 0);
      set({ unreadTotal: total });
    } catch (err) {
      console.error("Failed to fetch contacts unread total");
    }
  },

  connectWs: (token: string) => {
    const currentWs = get().ws;
    if (currentWs && (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const wsUrl = baseUrl.replace('http', 'ws') + `/ws/?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const data = event.data;
      if (data.startsWith('CHAT_MESSAGE:')) {
        const senderId = parseInt(data.split(':')[1]);
        get().setLastEvent('CHAT_MESSAGE', { senderId });
        get().fetchUnreadTotal();
      } else if (data.startsWith('CHAT_READ:')) {
        const readerId = parseInt(data.split(':')[1]);
        get().setLastEvent('CHAT_READ', { readerId });
      }
    };
    
    ws.onclose = () => {
      set({ ws: null });
      // Reconnect after 3 seconds if disconnected
      setTimeout(() => {
        if (get().ws === null) {
          get().connectWs(token);
        }
      }, 3000);
    };
    
    set({ ws });
  },

  disconnectWs: () => {
    const ws = get().ws;
    if (ws) {
      ws.onclose = null; // Prevent reconnect loop
      ws.close();
      set({ ws: null });
    }
  }
}));
