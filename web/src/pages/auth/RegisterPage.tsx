import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import api from '@/api/client';

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  password_confirm: z.string(),
  role: z.enum(['owner', 'admin', 'kasir']).default('kasir'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Password tidak cocok',
  path: ['password_confirm'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'kasir' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register/', data);
      login(res.data.user, res.data.access, res.data.refresh);
      setSuccess(true);
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData && typeof errData === 'object') {
        setError(Object.values(errData).flat().join(' '));
      } else {
        setError('Registrasi gagal. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-100">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Registrasi Berhasil!</h2>
          <p className="text-gray-500">Anda sudah bisa menggunakan Mercury POS.</p>
          <a href="/dashboard" className="btn btn-primary mt-6 inline-block">Ke Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-gray-100">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mercury POS</h1>
          <p className="text-gray-500 mt-1">Buat akun baru</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input {...register('email')} type="email" placeholder="email@contoh.com" className="input" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input {...register('password')} type="password" placeholder="Min. 8 karakter" className="input" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <input {...register('password_confirm')} type="password" placeholder="Ulangi password" className="input" />
            {errors.password_confirm && <p className="text-red-500 text-xs mt-1">{errors.password_confirm.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select {...register('role')} className="input">
              <option value="kasir">Kasir</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telepon (opsional)</label>
            <input {...register('phone')} type="tel" placeholder="081234567890" className="input" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full h-10">
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah punya akun? <a href="/login" className="text-indigo-600 hover:underline">Masuk</a>
        </p>
      </div>
    </div>
  );
}
