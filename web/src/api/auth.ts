import api from './client';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export const registerSchema = loginSchema.extend({
  name: z.string().min(1),
});

export const authApi = {
  login: async ({ email, password }: { email: string; password: string }) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },
};
