import { useState, useEffect } from 'react';
import { ScrollText, Filter, Calendar, User, Activity } from 'lucide-react';
import api from '@/api/client';

type AuditLog = {
  id: number;
  user_email: string;
  user_role: string;
  action: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  detail: string;
  ip_address: string;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  login: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  logout: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  role_change: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  activate: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  deactivate: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  export: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  pdf_generate: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterEmail, setFilterEmail] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterAction) params.action = filterAction;
      if (filterModel) params.model_name = filterModel;
      if (filterEmail) params.user_email = filterEmail;

      const res = await api.get('/auth/audit-log/', { params });
      setLogs(res.data);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [filterAction, filterModel, filterEmail]);

  const clearFilters = () => {
    setFilterAction('');
    setFilterModel('');
    setFilterEmail('');
  };

  const hasFilters = filterAction || filterModel || filterEmail;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold">Audit Log</h1>
        </div>
        <span className="text-sm text-gray-500">{logs.length} entries</span>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">Filters</span>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-indigo-600 hover:underline ml-auto">
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="input text-sm"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="role_change">Role Change</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="export">Export</option>
            <option value="pdf_generate">PDF Generate</option>
          </select>
          <input
            type="text"
            placeholder="Filter by model..."
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="input text-sm"
          />
          <input
            type="text"
            placeholder="Filter by email..."
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            className="input text-sm"
          />
        </div>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No audit log entries found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100'}`}>
                      {log.action}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {log.object_repr || log.model_name}
                    </p>
                    {log.detail && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{log.detail}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.user_email || 'system'}
                      </span>
                      {log.model_name && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {log.model_name}
                        </span>
                      )}
                      {log.ip_address && (
                        <span className="text-gray-300">{log.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(log.created_at).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
