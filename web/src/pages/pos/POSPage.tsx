import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import api from '@/api/client';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
});

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'ewallet'>('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/');
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.product_id === product.id);
      if (exists) {
        return prev.map((i) =>
          i.product_id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: product.price,
          discount: 0,
        },
      ];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product_id === id
            ? { ...i, quantity: Math.max(1, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((i) => i.product_id !== id));
  };

  const subtotal = cart.reduce(
    (acc, item) => acc + (item.unit_price - item.discount) * item.quantity,
    0
  );
  const total = subtotal; // no tax or shipping defined

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const payload = {
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: i.discount,
          subtotal: (i.unit_price - i.discount) * i.quantity,
        })),
        payment_method: paymentMethod,
        subtotal,
        total,
      };
      await api.post('/api/transactions/transactions/', payload);
      setCart([]);
      alert('Transaksi berhasil');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail ?? 'Checkout gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 p-4">
      {/* Left panel */}
      <div className="w-3/5 pr-4 flex flex-col">
        <input
          type="text"
          placeholder="Cari produk…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input mb-4"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto flex-grow">
          {filteredProducts.map((p) => (
          <div
            key={p.id}
            onClick={() => addToCart(p)}
            className="cursor-pointer p-4 hover:shadow-lg rounded border"
          >
            <h2 className="font-semibold text-lg mb-2">{p.name}</h2>
            <p className="text-sm text-gray-600">
              Harga: {currencyFormatter.format(p.price)}
            </p>
            <p className="text-sm text-gray-500">Stok: {p.stock}</p>
          </div>
          ))}
        </div>
      </div>
      {/* Right panel */}
      <div className="w-2/5 bg-white rounded shadow p-4 flex flex-col" style={{maxWidth:'400px'}}>
        <h3 className="text-xl font-bold mb-4">Keranjang</h3>
        {cart.length === 0 ? (
          <p className="text-gray-500">Keranjang kosong</p>
        ) : (
          <div className="flex-1 overflow-y-auto mb-4">
            {cart.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => updateQuantity(item.product_id, -1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => updateQuantity(item.product_id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p>{currencyFormatter.format(item.unit_price - item.discount)}</p>
                  <button onClick={() => removeItem(item.product_id)}>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="border-t pt-4 mb-4">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{currencyFormatter.format(subtotal)}</span>
          </p>
          <p className="flex justify-between font-semibold mt-2">
            <span>Total</span>
            <span>{currencyFormatter.format(total)}</span>
          </p>
        </div>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as any)}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
          <option value="ewallet">E-Wallet</option>
        </select>
        <Button
          disabled={loading || cart.length === 0}
          onClick={handleCheckout}
          className="w-full"
        >
          {loading ? 'Memproses...' : 'Checkout'}
        </Button>
      </div>
    </div>
  );
}
