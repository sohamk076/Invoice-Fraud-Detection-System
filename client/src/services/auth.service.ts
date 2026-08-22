import api from './api';
import { User } from '../types';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<LoginResponse>('/auth/login', credentials);
    return res.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
    phone?: string;
  }) => {
    const res = await api.post<LoginResponse>('/auth/register', data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<{ success: boolean; data: User }>('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('fraudshield_token');
      localStorage.removeItem('fraudshield_user');
    }
  },
};
