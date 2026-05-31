import React, { useEffect, useState } from 'react'
import { fetchTransactions } from '@/api/client'
import { Transition } from '@headlessui/react'

interface Transaction {
  id: string
  invoice_number: string
  customer_name: string
  total: number
  payment_method: string
  status: string
  created_at: string
  items: Item[]
}
interface Item {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

const statusOptions = [
  { value: "", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "hold", label: "Hold" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
]

const statusColor = {
  completed: 'bg-green-200 text-green-800',
  hold: 'bg-yellow-200 text-yellow-800',
  cancelled: 'bg-red-200 text-red-800',
  refunded: 'bg-gray-200 text-gray-800',
  default: 'bg-gray-200 text-gray-800',
}

const TransactionsPage: React.FC = () => {
  const [status, setStatus] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  const loadTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      const data = await fetchTransactions(`/api/transactions/transactions/?${params.toString()}`)
      setTransactions(data)
    } catch (e) {
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [status, dateFrom, dateTo])

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  })
  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Transactions</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          className="border rounded px-3 py-1"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="date"
          className="border rounded px-3 py-1"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          placeholder="From"
        />
        <input
          type="date"
          className="border rounded px-3 py-1"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          placeholder="To"
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Invoice</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Customer</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Total</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Payment</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Created At</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td className="px-4 py-2">{tx.invoice_number}</td>
                  <td className="px-4 py-2">{tx.customer_name}</td>
                  <td className="px-4 py-2">{formatter.format(tx.total)}</td>
                  <td className="px-4 py-2">{tx.payment_method}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded ${statusColor[tx.status] ?? statusColor.default} text-xs`}>{tx.status}</span>
                  </td>
                  <td className="px-4 py-2">{dateFormatter.format(new Date(tx.created_at))}</td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => { setSelectedTx(tx); setModalOpen(true) }}
                    >View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Transition appear show={modalOpen} as={React.Fragment}>
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-3/5 p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setModalOpen(false)}
            >✕</button>
            {selectedTx && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Transaction {selectedTx.invoice_number}</h2>
                <p><strong>Customer:</strong> {selectedTx.customer_name}</p>
                <p><strong>Payment Method:</strong> {selectedTx.payment_method}</p>
                <p><strong>Status:</strong> {selectedTx.status}</p>
                <p><strong>Total:</strong> {formatter.format(selectedTx.total)}</p>
                <p className="mb-4"><strong>Created At:</strong> {dateFormatter.format(new Date(selectedTx.created_at))}</p>

                <h3 className="text-lg font-medium mb-2">Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Product</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Unit Price</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTx.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-2">{item.product_name}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">{formatter.format(item.unit_price)}</td>
                          <td className="px-4 py-2">{formatter.format(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </Transition>
    </div>
  )
}

export default TransactionsPage
