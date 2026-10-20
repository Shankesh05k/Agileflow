import { create } from 'zustand';
import { User } from '../types';
import { auth as authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { set({ initialized: true }); return; }
    try {
      const user = await authApi.me();
      set({ user, initialized: true });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { user } = await authApi.login(email, password);
      set({ user, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: () => {
    authApi.logout();
    set({ user: null });
  },
}));
