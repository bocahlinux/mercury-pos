import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/api/client';
import { toast } from '@/stores/toastStore';
import { Skeleton } from '@/components/ui/Toast';
import { useCartStore } from '@/stores/cartStore';

/* ── Types ── */
interface Category {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface ReceiptData {
  id: number;
  invoice_number: string;
  store_name: string;
  store_address: string;
  store_phone: string;
  cashier_name: string;
  customer_name: string;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount_value: number;
  tax_percent: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  payment_amount: number;
  change_amount: number;
  status: string;
  notes: string;
  created_at: string;
}

/* ── Helpers ── */
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

/* ── Component ── */
export default function POSPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  // Cart store
  const cart = useCartStore();

  const TAX_PERCENT = 11;

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const params: Record<string, string | number> = {};
      if (search) params.search = search;
      if (categoryId) params.category = categoryId;
      const res = await api.get('/products/products/', { params });
      setProducts(res.data.results || res.data);
    } catch (e) { /* handled by interceptor */ }
  }, [search, categoryId]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories/');
      setCategories(res.data.results || res.data);
    } catch (e) { /* handled by interceptor */ }
  };

  // Fetch customers
  const fetchCustomers = async (searchTerm = '') => {
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/customers/', { params });
      setCustomers(res.data.results || res.data);
    } catch (e) { /* handled by interceptor */ }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchProducts(), fetchCustomers()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, categoryId, fetchProducts]);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Computed values
  const subtotal = cart.getSubtotal();
  const itemDiscounts = cart.getItemDiscounts();
  const orderDiscount = cart.getOrderDiscount();
  const tax = cart.getTax(TAX_PERCENT);
  const total = cart.getTotal(TAX_PERCENT);
  const cashNum = cart.cashReceived;
  const change = cart.paymentMethod === 'cash' ? Math.max(0, cashNum - total) : 0;

  /* ── Checkout ── */
  const handleCheckout = async () => {
    if (cart.items.length === 0) return toast.warning('Keranjang kosong');
    if (cart.paymentMethod === 'cash' && cashNum < total) {
      return toast.warning('Uang diterima kurang dari total');
    }

    setCheckingOut(true);
    try {
      const res = await api.post('/transactions/transactions/', {
        customer: cart.customerId,
        items: cart.items.map((i) => ({
          product: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.sell_price,
          discount: i.discount,
          subtotal: i.subtotal - i.discount * i.quantity,
        })),
        payment_method: cart.paymentMethod,
        payment_amount: cart.paymentMethod === 'cash' ? cashNum : total,
        change_amount: change,
        subtotal,
        discount_type: cart.discountType,
        discount_value: orderDiscount,
        tax_percent: TAX_PERCENT,
        tax_amount: tax,
        total,
        notes: cart.notes,
      });

      // Fetch receipt data
      const receiptRes = await api.get(`/transactions/transactions/${res.data.id}/receipt/`);
      setReceiptData(receiptRes.data);
      setShowCheckout(false);
      setShowReceipt(true);
      cart.clearCart();
      toast.success(`Transaksi berhasil! Total: ${fmt(total)}`);
    } catch (e) {
      // error handled by interceptor
    } finally {
      setCheckingOut(false);
    }
  };

  /* ── Print receipt ── */
  const handlePrint = () => {
    window.print();
  };

  /* ── Render ── */
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Left: Product grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-1"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            className="input w-48"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">Tidak ada produk ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => cart.addItem(p)}
                disabled={p.stock <= 0}
                className={`card p-3 text-left transition hover:shadow-md ${p.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="h-16 bg-gray-100 rounded mb-2 flex items-center justify-center">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full object-contain" />
                  ) : (
                    <span className="text-2xl text-gray-300">📦</span>
                  )}
                </div>
                <h3 className="font-medium text-sm truncate">{p.name}</h3>
                <p className="text-indigo-600 font-bold text-sm">{fmt(p.sell_price)}</p>
                <p className={`text-xs ${p.stock <= p.min_stock_alert ? 'text-red-500' : 'text-gray-400'}`}>
                  Stok: {p.stock}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-white flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Keranjang ({cart.getItemCount()})</h2>
          {cart.items.length > 0 && (
            <button onClick={() => cart.clearCart()} className="text-sm text-red-500 hover:text-red-700">
              Kosongkan
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🛒</p>
              <p>Keranjang kosong</p>
              <p className="text-xs mt-1">Tap produk untuk menambahkan</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.product.id} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{fmt(item.product.sell_price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => cart.updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold"
                  >−</button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => cart.updateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold"
                  >+</button>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{fmt(item.subtotal)}</p>
                  <button
                    onClick={() => cart.removeItem(item.product.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >Hapus</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart summary */}
        {cart.items.length > 0 && (
          <div className="border-t p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {itemDiscounts > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Diskon Item</span>
                <span>−{fmt(itemDiscounts)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pajak ({TAX_PERCENT}%)</span>
              <span>{fmt(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-indigo-600">{fmt(total)}</span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="btn btn-primary w-full mt-2"
            >
              Bayar
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold">Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Total */}
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <p className="text-sm text-indigo-600">Total Bayar</p>
                <p className="text-3xl font-bold text-indigo-700">{fmt(total)}</p>
              </div>

              {/* Customer selection */}
              <div ref={customerRef} className="relative">
                <label className="block text-sm font-medium mb-1">Pelanggan (opsional)</label>
                <input
                  type="text"
                  placeholder="Cari pelanggan..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                    fetchCustomers(e.target.value);
                  }}
                  onFocus={() => {
                    setShowCustomerDropdown(true);
                    fetchCustomers(customerSearch);
                  }}
                  className="input w-full"
                />
                {cart.customerId && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-indigo-600 font-medium">✓ {cart.customerName}</span>
                    <button
                      onClick={() => { cart.setCustomer(null, ''); setCustomerSearch(''); }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >Hapus</button>
                  </div>
                )}
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-auto">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          cart.setCustomer(c.id, c.name);
                          setCustomerSearch(c.name);
                          setShowCustomerDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      >
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email} · {c.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Order discount */}
              <div>
                <label className="block text-sm font-medium mb-1">Diskon</label>
                <div className="flex gap-2">
                  <select
                    value={cart.discountType}
                    onChange={(e) => cart.setDiscount(e.target.value as any, cart.discountValue)}
                    className="input w-24"
                  >
                    <option value="percent">%</option>
                    <option value="fixed">Rp</option>
                  </select>
                  <input
                    type="number"
                    value={cart.discountValue || ''}
                    onChange={(e) => cart.setDiscount(cart.discountType, Number(e.target.value) || 0)}
                    placeholder="0"
                    className="input flex-1"
                  />
                </div>
                {orderDiscount > 0 && (
                  <p className="text-sm text-red-500 mt-1">Diskon: −{fmt(orderDiscount)}</p>
                )}
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'transfer', 'ewallet', 'mixed'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => cart.setPaymentMethod(m)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium transition ${
                        cart.paymentMethod === m
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {m === 'cash' ? 'Tunai' : m === 'transfer' ? 'Transfer' : m === 'ewallet' ? 'E-Wallet' : 'Campuran'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input */}
              {cart.paymentMethod === 'cash' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Uang Diterima</label>
                  <input
                    type="number"
                    value={cart.cashReceived || ''}
                    onChange={(e) => cart.setCashReceived(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="input text-lg font-bold"
                    autoFocus
                  />
                  {cashNum >= total && (
                    <div className="mt-2 bg-green-50 rounded-lg p-3 flex justify-between">
                      <span className="text-green-700">Kembali</span>
                      <span className="font-bold text-green-700">{fmt(change)}</span>
                    </div>
                  )}
                  {cashNum > 0 && cashNum < total && (
                    <p className="mt-1 text-sm text-red-500">
                      Kurang: {fmt(total - cashNum)}
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Catatan</label>
                <input
                  type="text"
                  value={cart.notes}
                  onChange={(e) => cart.setNotes(e.target.value)}
                  placeholder="Catatan transaksi (opsional)"
                  className="input"
                />
              </div>

              {/* Cart items summary */}
              <div className="border rounded-lg p-3 max-h-40 overflow-auto">
                <p className="text-sm font-medium mb-2">Item ({cart.getItemCount()})</p>
                {cart.items.map((i) => (
                  <div key={i.product.id} className="flex justify-between text-sm py-1">
                    <span className="truncate">{i.product.name} ×{i.quantity}</span>
                    <span className="ml-2 whitespace-nowrap">{fmt(i.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => setShowCheckout(false)}
                className="btn btn-secondary flex-1"
              >
                Kembali
              </button>
              <button
                onClick={handleCheckout}
                disabled={checkingOut || (cart.paymentMethod === 'cash' && cashNum < total)}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {checkingOut ? 'Memproses...' : 'Selesaikan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-auto">
            {/* Receipt content */}
            <div id="receipt-content" className="p-6 text-sm">
              {/* Store header */}
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">{receiptData.store_name || 'Mercury POS'}</h2>
                {receiptData.store_address && <p className="text-gray-500 text-xs">{receiptData.store_address}</p>}
                {receiptData.store_phone && <p className="text-gray-500 text-xs">{receiptData.store_phone}</p>}
              </div>

              <div className="border-t border-dashed my-3" />

              {/* Transaction info */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>No. Invoice</span>
                  <span className="font-medium">{receiptData.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal</span>
                  <span>{new Date(receiptData.created_at).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir</span>
                  <span>{receiptData.cashier_name}</span>
                </div>
                {receiptData.customer_name && receiptData.customer_name !== '-' && (
                  <div className="flex justify-between">
                    <span>Pelanggan</span>
                    <span>{receiptData.customer_name}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed my-3" />

              {/* Items */}
              <div className="space-y-2">
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <p className="font-medium">{item.product_name}</p>
                    <div className="flex justify-between text-gray-500">
                      <span>{item.quantity} × {fmt(item.unit_price)}</span>
                      <span>{fmt(item.subtotal)}</span>
                    </div>
                    {item.discount > 0 && (
                      <p className="text-red-500">Diskon: −{fmt(item.discount)}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed my-3" />

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{fmt(receiptData.subtotal)}</span>
                </div>
                {receiptData.discount_value > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Diskon</span>
                    <span>−{fmt(receiptData.discount_value)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pajak ({receiptData.tax_percent}%)</span>
                  <span>{fmt(receiptData.tax_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t pt-1">
                  <span>Total</span>
                  <span>{fmt(receiptData.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar ({receiptData.payment_method})</span>
                  <span>{fmt(receiptData.payment_amount)}</span>
                </div>
                {receiptData.change_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Kembali</span>
                    <span>{fmt(receiptData.change_amount)}</span>
                  </div>
                )}
              </div>

              {receiptData.notes && (
                <>
                  <div className="border-t border-dashed my-3" />
                  <p className="text-xs text-gray-500">Catatan: {receiptData.notes}</p>
                </>
              )}

              <div className="border-t border-dashed my-3" />
              <p className="text-center text-xs text-gray-400">Terima kasih telah berbelanja!</p>
            </div>

            {/* Actions */}
            <div className="p-4 border-t flex gap-3 print:hidden">
              <button
                onClick={() => setShowReceipt(false)}
                className="btn btn-secondary flex-1"
              >
                Tutup
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-primary flex-1"
              >
                🖨️ Cetak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
