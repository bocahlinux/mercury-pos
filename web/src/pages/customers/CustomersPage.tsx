import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import api from '@/api/client';
import type { Customer } from '@/types';

const customerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers/', { params: search ? { search } : {} });
      setCustomers(res.data.results || res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  const openCreate = () => { setEditing(null); reset({ name: '', email: '', phone: '', address: '', notes: '' }); setModalOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); reset({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '' }); setModalOpen(true); };

  const onSubmit = async (data: CustomerForm) => {
    try {
      if (editing) {
        await api.patch(`/customers/${editing.id}/`, data);
      } else {
        await api.post('/customers/', data);
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (e: any) { alert(e.response?.data?.detail || 'Gagal simpan'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/customers/${deleteId}/`);
      setDeleteId(null);
      fetchCustomers();
    } catch (e) { alert('Gagal hapus'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pelanggan</h1>
        <button onClick={openCreate} className="btn btn-primary gap-2"><Plus size={16} /> Tambah Pelanggan</button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pelanggan..." className="input pl-10" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Nama</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Telepon</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Points</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Transaksi</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '-'}</td>
                  <td className="px-4 py-3"><span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">{c.loyalty_points}</span></td>
                  <td className="px-4 py-3 text-gray-500">{c.transaction_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800 mr-2"><Pencil size={16} /></button>
                    <button onClick={() => setDeleteId(c.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada pelanggan</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h2>
              <button onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama *</label>
                <input {...register('name')} className="input" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input {...register('email')} type="email" className="input" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telepon</label>
                  <input {...register('phone')} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alamat</label>
                <textarea {...register('address')} className="input" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catatan</label>
                <textarea {...register('notes')} className="input" rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm p-6 text-center">
            <h2 className="text-lg font-bold mb-2">Hapus Pelanggan?</h2>
            <p className="text-gray-500 mb-4">Data pelanggan akan dihapus permanen.</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setDeleteId(null)} className="btn btn-secondary">Batal</button>
              <button onClick={handleDelete} className="btn btn-danger">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
