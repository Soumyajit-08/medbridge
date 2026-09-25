import { api } from './api';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  AuthUser,
} from '@/types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async register(payload: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refresh(): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/refresh');
    return data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/me');
    return data;
  },

  async updateProfile(payload: Partial<AuthUser>): Promise<AuthUser> {
    const { data } = await api.patch<AuthUser>('/auth/profile', payload);
    return data;
  },
};
