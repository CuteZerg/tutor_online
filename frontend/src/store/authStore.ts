import { create } from 'zustand';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'tutor' | 'student' | 'parent';
  is_active: boolean;
  balance: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!Cookies.get('access_token'),
  isLoading: false,
  setToken: (token) => {
    Cookies.set('access_token', token, { expires: 1 }); // 1 day
    set({ isAuthenticated: true });
  },
  logout: () => {
    Cookies.remove('access_token');
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  },
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
