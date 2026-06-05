import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Shield, UserCheck, UserX, Trash2, Search } from 'lucide-react';
import api from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

type User = {
  id: number;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  date_joined: string;
};

const roleSchema = z.object({
  role: z.enum(['owner', 'admin', 'kasir']),
});

type RoleForm = z.infer<typeof roleSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const currentUser = useAuthStore((s) => s.user);

  const { register, handleSubmit, formState: { errors } } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users/manage/');
      setUsers(res.data);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onRoleChange = async (userId: number, data: RoleForm) => {
    try {
      await api.patch(`/auth/users/manage/${userId}/update_role/`, data);
      setEditingRole(null);
      fetchUsers();
    } catch {
      // error handled by interceptor
    }
  };

  const onToggleActive = async (userId: number, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await api.post(`/auth/users/manage/${userId}/deactivate/`);
      } else {
        await api.post(`/auth/users/manage/${userId}/activate/`);
      }
      fetchUsers();
    } catch {
      // error handled by interceptor
    }
  };

  const onDelete = async (userId: number, email: string) => {
    if (!window.confirm(`Hapus user ${email}?`)) return;
    try {
      await api.delete(`/auth/users/manage/${userId}/`);
      fetchUsers();
    } catch {
      // error handled by interceptor
    }
  };

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      kasir: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[role] || 'bg-gray-100'}`}>
        {role}
      </span>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
        <span className="text-sm text-gray-500">{users.length} users</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 w-full max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Phone</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Joined</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-medium text-xs">
                        {user.email[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{user.email}</span>
                      {user.id === currentUser?.id && (
                        <span className="text-xs text-gray-400">(you)</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {editingRole === user.id ? (
                      <form onSubmit={handleSubmit((data) => onRoleChange(user.id, data))} className="flex items-center gap-2">
                        <select {...register('role')} defaultValue={user.role} className="input py-1 text-xs">
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="kasir">Kasir</option>
                        </select>
                        <button type="submit" className="text-xs text-indigo-600 hover:underline">Save</button>
                        <button type="button" onClick={() => setEditingRole(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2">
                        {roleBadge(user.role)}
                        <button onClick={() => setEditingRole(user.id)} className="text-xs text-gray-400 hover:text-indigo-600">
                          <Shield className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-gray-500">{user.phone || '—'}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-xs ${user.is_active ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 text-xs">
                    {new Date(user.date_joined).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      {user.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => onToggleActive(user.id, user.is_active)}
                            className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${user.is_active ? 'text-amber-500' : 'text-green-500'}`}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => onDelete(user.id, user.email)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Tidak ada user ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
