import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: number;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  date_joined: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      login: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken });
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: 'auth-storage' }
  )
);

export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setAccessToken = (token: string) => localStorage.setItem('accessToken', token);
export const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
