import React, { useEffect, useState, useCallback } from 'react';
import api from '@/api/client';
import { toast } from '@/stores/toastStore';
import { Skeleton } from '@/components/ui/Toast';

/* ── Types ── */
interface Product {
  id: number;
  name: string;
  sku: string;
  sell_price: number;
  stock: number;
  min_stock_alert: number;
  category: { id: number; name: string } | null;
  image: string | null;
}

interface Category {
  id: number;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
}

/* ── Helpers ── */
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

/* ── Component ── */
export default function POSPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'ewallet'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxPercent] = useState(11); // default PPN

  // Fetch
  const fetchProducts = useCallback(async () => {
    try {
      const params: Record<string, string | number> = {};
      if (search) params.search = search;
      if (categoryId) params.category = categoryId;
      const res = await api.get('/products/products/', { params });
      setProducts(res.data.results || res.data);
    } catch (e) {
      // error handled by interceptor
    }
  }, [search, categoryId]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories/');
      setCategories(res.data.results || res.data);
    } catch (e) {
      // error handled by interceptor
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchProducts()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, categoryId, fetchProducts]);

  /* ── Cart operations ── */
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning(`Stok ${product.name} hanya ${product.stock}`);
          return prev;
        }
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (product.sell_price - i.discount) * (i.quantity + 1) }
            : i
        );
      }
      return [...prev, { product, quantity: 1, discount: 0, subtotal: product.sell_price }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.product.id !== productId) return i;
          const qty = Math.max(1, Math.min(i.quantity + delta, i.product.stock));
          return { ...i, quantity: qty, subtotal: (i.product.sell_price - i.discount) * qty };
        })
    );
  };

  const setItemDiscount = (productId: number, discount: number) => {
    setCart(prev =>
      prev.map(i => {
        if (i.product.id !== productId) return i;
        return { ...i, discount, subtotal: (i.product.sell_price - discount) * i.quantity };
      })
    );
  };

  const removeItem = (productId: number) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setShowCheckout(false);
    setCashReceived('');
    setDiscountValue(0);
  };

  /* ── Calculations ── */
  const subtotal = cart.reduce((s, i) => s + i.product.sell_price * i.quantity, 0);
  const itemDiscounts = cart.reduce((s, i) => s + i.discount * i.quantity, 0);
  const afterItemDiscounts = subtotal - itemDiscounts;
  const orderDiscount = discountType === 'percent'
    ? (afterItemDiscounts * discountValue) / 100
    : discountValue;
  const afterOrderDiscount = afterItemDiscounts - orderDiscount;
  const tax = (afterOrderDiscount * taxPercent) / 100;
  const total = afterOrderDiscount + tax;
  const cashNum = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'cash' ? Math.max(0, cashNum - total) : 0;

  /* ── Checkout ── */
  const handleCheckout = async () => {
    if (cart.length === 0) return toast.warning('Keranjang kosong');
    if (paymentMethod === 'cash' && cashNum < total) {
      return toast.warning('Uang diterima kurang dari total');
    }

    setCheckingOut(true);
    try {
      await api.post('/transactions/transactions/', {
        items: cart.map(i => ({
          product: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.sell_price,
          discount: i.discount,
          subtotal: i.subtotal - (i.discount * i.quantity),
        })),
        payment_method: paymentMethod,
        payment_amount: paymentMethod === 'cash' ? cashNum : total,
        change_amount: change,
        subtotal,
        discount_type: discountType || 'percent',
        discount_value: orderDiscount,
        tax_percent: taxPercent,
        tax_amount: tax,
        total,
      });

      toast.success(`Transaksi berhasil! Total: ${fmt(total)}`);
      clearCart();
    } catch (e) {
      // error handled by interceptor
    } finally {
      setCheckingOut(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Left: Product grid */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Search & filter */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input flex-1"
          />
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            className="input w-48"
          >
            <option value="">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Product grid */}
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
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
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
          <h2 className="text-lg font-bold">Keranjang ({cart.length})</h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700">
              Kosongkan
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🛒</p>
              <p>Keranjang kosong</p>
              <p className="text-xs mt-1">Tap produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{fmt(item.product.sell_price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.product.id, -1)}
                    className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold"
                  >−</button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.product.id, 1)}
                    className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold"
                  >+</button>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{fmt(item.subtotal)}</p>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >Hapus</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart summary */}
        {cart.length > 0 && (
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
              <span className="text-gray-500">Pajak ({taxPercent}%)</span>
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

              {/* Order discount */}
              <div>
                <label className="block text-sm font-medium mb-1">Diskon</label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="input w-24"
                  >
                    <option value="percent">%</option>
                    <option value="fixed">Rp</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue || ''}
                    onChange={e => setDiscountValue(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="input flex-1"
                  />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'transfer', 'ewallet'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                        paymentMethod === m
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {m === 'cash' ? 'Tunai' : m === 'transfer' ? 'Transfer' : 'E-Wallet'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Uang Diterima</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
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

              {/* Cart items summary */}
              <div className="border rounded-lg p-3 max-h-40 overflow-auto">
                <p className="text-sm font-medium mb-2">Item ({cart.length})</p>
                {cart.map(i => (
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
                disabled={checkingOut || (paymentMethod === 'cash' && cashNum < total)}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {checkingOut ? 'Memproses...' : 'Selesaikan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
