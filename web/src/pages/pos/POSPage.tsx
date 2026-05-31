import React, { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface Product {
  id: number
  name: string
  price: number
  stock: number
  category_id: number
}
interface Category {
  id: number
  name: string
}
interface CartItem {
  product: Product
  quantity: number
  discount: number
  subtotal: number
}

export default function POSPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'ewallet'>('cash')

  const fetchProducts = async () => {
    try {
      const params: any = {}
      if (search) params.search = search
      if (category) params.category = category
      const res = await api.get('/api/products/products/', { params })
      setProducts(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/products/categories/')
      setCategories(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [search, category])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        const updated = prev.map(item => {
          if (item.product.id === product.id) {
            const qty = item.quantity + 1
            const subtotal = (product.price - item.discount) * qty
            return { ...item, quantity: qty, subtotal }
          }
          return item
        })
        return updated
      }
      return [{ product, quantity: 1, discount: 0, subtotal: product.price }]
    })
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const qty = Math.max(1, item.quantity + delta)
            const subtotal = (item.product.price - item.discount) * qty
            return { ...item, quantity: qty, subtotal }
          }
          return item
        })
        .filter(item => item.quantity > 0)
    })
  }

  const removeItem = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const subTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = 0 // placeholder for any tax logic
  const total = subTotal + tax

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
  }

  const checkout = async () => {
    const payload = {
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        discount: item.discount,
        subtotal: item.subtotal
      })),
      payment_method: paymentMethod,
      subtotal: subTotal,
      total
    }
    try {
      await api.post('/api/transactions/transactions/', payload)
      setCart([])
      toast.success('Berhasil checkout!')
    } catch (e) {
      console.error(e)
      toast.error('Gagal checkout')
    }
  }

  return (
    <div className="flex h-screen">
      <div className="w-3/5 p-4 overflow-auto">
        <div className="mb-4 flex space-x-4">
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border rounded p-2"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="border rounded p-4 cursor-pointer hover:bg-gray-50" onClick={() => addToCart(p)}>
              <h3 className="font-semibold">{p.name}</h3>
              <p>{formatIDR(p.price)}</p>
              <p className="text-sm text-gray-500">Stok: {p.stock}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="w-2/5 p-4 border-l flex flex-col">
        <h2 className="text-xl font-bold mb-4">Keranjang</h2>
        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? <p>Keranjang kosong</p> : null}
          {cart.map(item => (
            <div key={item.product.id} className="flex items-center justify-between mb-2 border-b pb-2">
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-gray-500">{formatIDR(item.product.price)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => updateQuantity(item.product.id, -1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, 1)}>+</button>
              </div>
              <div className="flex items-center space-x-2">
                <p>{formatIDR(item.subtotal)}</p>
                <button onClick={() => removeItem(item.product.id)} className="text-red-500">×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatIDR(subTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total:</span>
            <span>{formatIDR(total)}</span>
          </div>
          <div className="mt-4">
            <label className="mr-2">Pembayaran:</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="ewallet">Ewallet</option>
            </select>
          </div>
          <button onClick={checkout} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full">
            Checkout
          </button>
        </div>
      </div>
      <toast.Container />
    </div>
  )
}
