import React, { useEffect, useState } from 'react'
import api from '@/api/client';
import { DateTime } from 'luxon'
import { ArrowRight, Eye } from 'lucide-react'
// Tailwind and optional component library

interface Transaction {
  id: string
  invoice_number: string
  customer_name: string
  total: number
  payment_method: string
  status: 'completed' | 'hold' | 'cancelled' | 'refunded'
  created_at: string
  items: Item[]
}
interface Item {
  id: string
  name: string
  quantity: number
  price: number
}

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'hold', label: 'Hold' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const statusColors: Record<Transaction['status'], string> = {
  completed: 'bg-green-500 text-white',
  hold: 'bg-yellow-500 text-black',
  cancelled: 'bg-red-500 text-white',
  refunded: 'bg-gray-400 text-black',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const formatDate = (iso: string) =>
  DateTime.fromISO(iso)
    .setLocale('id')
    .toFormat('dd MMM yyyy HH:mm')

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [selected, setSelected] = useState<Transaction | null>(null)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | undefined> = {
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }
      const res = await api.get<Transaction[]>('/transactions/', {
        params,
      })
      setTransactions(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [statusFilter, dateFrom, dateTo])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <label className="mr-2">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <label className="mr-2">From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div className="flex items-center">
          <label className="mr-2">To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="p-3 border">Invoice</th>
              <th className="p-3 border">Customer</th>
              <th className="p-3 border">Total</th>
              <th className="p-3 border">Payment</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Created</th>
              <th className="p-3 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  Loading…
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-3 border">{t.invoice_number}</td>
                  <td className="p-3 border">{t.customer_name}</td>
                  <td className="p-3 border">{formatCurrency(t.total)}</td>
                  <td className="p-3 border">{t.payment_method}</td>
                  <td className="p-3 border">
                    <span
                      className={`px-2 py-1 rounded ${statusColors[t.status]}`}
                    >
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3 border">{formatDate(t.created_at)}</td>
                  <td className="p-3 border">
                    <button
                      onClick={() => setSelected(t)}
                      className="text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Eye size={16} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-1/2 p-6 relative">
            <h2 className="text-xl font-bold mb-4">Transaction {selected.invoice_number}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <strong>Customer:</strong> {selected.customer_name}
              </div>
              <div>
                <strong>Total:</strong> {formatCurrency(selected.total)}
              </div>
              <div>
                <strong>Payment Method:</strong> {selected.payment_method}
              </div>
              <div>
                <strong>Created At:</strong> {formatDate(selected.created_at)}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span
                  className={`px-2 py-1 rounded ${statusColors[selected.status]}`}
                >
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">Qty</th>
                    <th className="p-2 border">Price</th>
                    <th className="p-2 border">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((i) => (
                    <tr key={i.id}>
                      <td className="p-2 border">{i.name}</td>
                      <td className="p-2 border">{i.quantity}</td>
                      <td className="p-2 border">{formatCurrency(i.price)}</td>
                      <td className="p-2 border">{formatCurrency(i.price * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionsPage
