import React, { useEffect, useState, useCallback } from 'react';
import api from '@/api/client';
import { DateTime } from 'luxon';
import { Eye, Pause, Play, XCircle, RotateCcw, Printer } from 'lucide-react';

interface Transaction {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  payment_method: string;
  status: 'completed' | 'hold' | 'cancelled' | 'refunded';
  created_at: string;
  items?: any[];
}

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'hold', label: 'Hold' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  hold: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (iso: string) =>
  DateTime.fromISO(iso).setLocale('id').toFormat('dd MMM yyyy HH:mm');

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.start_date = dateFrom;
      if (dateTo) params.end_date = dateTo;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get('/transactions/transactions/', { params });
      const data = res.data;
      setTransactions(Array.isArray(data) ? data : data.results ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const fetchDetail = async (t: Transaction) => {
    setSelected(t);
    setDetailLoading(true);
    try {
      const res = await api.get(`/transactions/transactions/${t.id}/`);
      setDetailData(res.data);
    } catch (e) {
      console.error(e);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const action = async (actionName: string, id: string, extra?: Record<string, any>) => {
    try {
      await api.post(`/transactions/transactions/${id}/${actionName}/`, extra || {});
      fetchTransactions();
      // Refresh detail if open
      if (selected?.id === id) {
        const res = await api.get(`/transactions/transactions/${id}/`);
        setDetailData(res.data);
        setSelected({ ...selected, status: actionName === 'resume' ? 'completed' : actionName === 'hold' ? 'hold' : actionName === 'cancel' ? 'cancelled' : 'refunded' });
      }
    } catch (e: any) {
      alert(e.response?.data?.detail || `Failed to ${actionName}`);
    }
  };

  const printReceipt = async (id: string) => {
    try {
      const res = await api.get(`/transactions/transactions/${id}/download-pdf/`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      alert('Failed to download receipt PDF');
    }
  };

  const handleRefund = (id: string) => {
    const reason = prompt('Refund reason:', 'Refund');
    if (reason === null) return; // cancelled
    action('refund', id, { reason });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search invoice or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <button onClick={fetchTransactions} className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600">
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="p-3 border text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
              <th className="p-3 border text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="p-3 border text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="p-3 border text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="p-3 border text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="p-3 border text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="p-3 border text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center p-4">Loading…</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-4">No transactions found.</td></tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">{t.invoice_number}</td>
                  <td className="p-3 border">{t.customer_name || '-'}</td>
                  <td className="p-3 border">{formatCurrency(t.total)}</td>
                  <td className="p-3 border">{t.payment_method}</td>
                  <td className="p-3 border">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[t.status]}`}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3 border text-sm">{formatDate(t.created_at)}</td>
                  <td className="p-3 border">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button onClick={() => fetchDetail(t)} className="text-blue-600 hover:text-blue-800 p-1" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => printReceipt(t.id)} className="text-gray-600 hover:text-gray-800 p-1" title="Print Receipt">
                        <Printer size={16} />
                      </button>
                      {t.status === 'completed' && (
                        <>
                          <button onClick={() => action('hold', t.id)} className="text-yellow-600 hover:text-yellow-800 p-1" title="Hold">
                            <Pause size={16} />
                          </button>
                          <button onClick={() => action('cancel', t.id)} className="text-red-600 hover:text-red-800 p-1" title="Cancel">
                            <XCircle size={16} />
                          </button>
                          <button onClick={() => handleRefund(t.id)} className="text-orange-600 hover:text-orange-800 p-1" title="Refund">
                            <RotateCcw size={16} />
                          </button>
                        </>
                      )}
                      {t.status === 'hold' && (
                        <>
                          <button onClick={() => action('resume', t.id)} className="text-green-600 hover:text-green-800 p-1" title="Resume">
                            <Play size={16} />
                          </button>
                          <button onClick={() => action('cancel', t.id)} className="text-red-600 hover:text-red-800 p-1" title="Cancel">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => { setSelected(null); setDetailData(null); }}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-1/2 p-6 relative max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setSelected(null); setDetailData(null); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Transaction {selected.invoice_number}</h2>

            {detailLoading ? (
              <p className="text-gray-500">Loading details...</p>
            ) : detailData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><strong>Customer:</strong> {detailData.customer_name || selected.customer_name}</div>
                  <div><strong>Total:</strong> {formatCurrency(detailData.total)}</div>
                  <div><strong>Payment Method:</strong> {detailData.payment_method}</div>
                  <div><strong>Created At:</strong> {formatDate(detailData.created_at)}</div>
                  <div><strong>Status:</strong>{' '}
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[detailData.status] || statusColors[selected.status]}`}>
                      {(detailData.status || selected.status).charAt(0).toUpperCase() + (detailData.status || selected.status).slice(1)}
                    </span>
                  </div>
                  <div><strong>Cashier:</strong> {detailData.cashier_name || detailData.cashier?.email || '-'}</div>
                </div>

                {detailData.items && detailData.items.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Items</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border">
                        <thead>
                          <tr>
                            <th className="p-2 border text-left">Product</th>
                            <th className="p-2 border text-right">Qty</th>
                            <th className="p-2 border text-right">Price</th>
                            <th className="p-2 border text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.items.map((i: any, idx: number) => (
                            <tr key={i.id || idx}>
                              <td className="p-2 border">{i.product_name || i.product?.name || '-'}</td>
                              <td className="p-2 border text-right">{i.quantity}</td>
                              <td className="p-2 border text-right">{formatCurrency(i.unit_price || i.price || 0)}</td>
                              <td className="p-2 border text-right">{formatCurrency(i.subtotal || (i.quantity * (i.unit_price || i.price || 0)))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {detailData.notes && (
                  <div>
                    <strong>Notes:</strong>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{detailData.notes}</p>
                  </div>
                )}

                {/* Action buttons in modal */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => printReceipt(selected.id)}
                    className="bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600 flex items-center gap-1"
                  >
                    <Printer size={14} /> Print Receipt
                  </button>
                  {selected.status === 'completed' && (
                    <>
                      <button onClick={() => action('hold', selected.id)} className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-600 flex items-center gap-1">
                        <Pause size={14} /> Hold
                      </button>
                      <button onClick={() => action('cancel', selected.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 flex items-center gap-1">
                        <XCircle size={14} /> Cancel
                      </button>
                      <button onClick={() => handleRefund(selected.id)} className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-600 flex items-center gap-1">
                        <RotateCcw size={14} /> Refund
                      </button>
                    </>
                  )}
                  {selected.status === 'hold' && (
                    <>
                      <button onClick={() => action('resume', selected.id)} className="bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 flex items-center gap-1">
                        <Play size={14} /> Resume
                      </button>
                      <button onClick={() => action('cancel', selected.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 flex items-center gap-1">
                        <XCircle size={14} /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Customer:</strong> {selected.customer_name}</p>
                <p><strong>Total:</strong> {formatCurrency(selected.total)}</p>
                <p><strong>Status:</strong> {selected.status}</p>
                <p className="text-gray-500 text-sm">Failed to load full details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
