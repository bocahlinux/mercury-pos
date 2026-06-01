import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: number;
  name: string;
  sku: string;
  sell_price: number;
  stock: number;
  min_stock_alert: number;
  category: { id: number; name: string } | null;
  image: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
}

interface CartStore {
  items: CartItem[];
  customerId: number | null;
  customerName: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  paymentMethod: 'cash' | 'transfer' | 'ewallet' | 'mixed';
  paymentAmount: number;
  cashReceived: number;
  changeAmount: number;
  notes: string;

  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  setItemDiscount: (productId: number, discount: number) => void;
  setCustomer: (id: number | null, name: string) => void;
  setDiscount: (type: 'percent' | 'fixed', value: number) => void;
  setPaymentMethod: (method: 'cash' | 'transfer' | 'ewallet' | 'mixed') => void;
  setPaymentAmount: (amount: number) => void;
  setCashReceived: (amount: number) => void;
  setChangeAmount: (amount: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;

  // Computed
  getSubtotal: () => number;
  getItemDiscounts: () => number;
  getOrderDiscount: () => number;
  getTax: (taxPercent: number) => number;
  getTotal: (taxPercent: number) => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      customerName: '',
      discountType: 'percent',
      discountValue: 0,
      paymentMethod: 'cash',
      paymentAmount: 0,
      cashReceived: 0,
      changeAmount: 0,
      notes: '',

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) return;
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? {
                    ...i,
                    quantity: i.quantity + 1,
                    subtotal: (product.sell_price - i.discount) * (i.quantity + 1),
                  }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { product, quantity: 1, discount: 0, subtotal: product.sell_price }],
          });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      updateQuantity: (productId, delta) => {
        set({
          items: get().items
            .map((i) => {
              if (i.product.id !== productId) return i;
              const qty = Math.max(1, Math.min(i.quantity + delta, i.product.stock));
              return { ...i, quantity: qty, subtotal: (i.product.sell_price - i.discount) * qty };
            })
            .filter((i) => i.quantity > 0),
        });
      },

      setItemDiscount: (productId, discount) => {
        set({
          items: get().items.map((i) => {
            if (i.product.id !== productId) return i;
            return { ...i, discount, subtotal: (i.product.sell_price - discount) * i.quantity };
          }),
        });
      },

      setCustomer: (id, name) => set({ customerId: id, customerName: name }),

      setDiscount: (type, value) => set({ discountType: type, discountValue: value }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setPaymentAmount: (amount) => set({ paymentAmount: amount }),

      setCashReceived: (amount) => set({ cashReceived: amount }),

      setChangeAmount: (amount) => set({ changeAmount: amount }),

      setNotes: (notes) => set({ notes }),

      clearCart: () =>
        set({
          items: [],
          customerId: null,
          customerName: '',
          discountType: 'percent',
          discountValue: 0,
          paymentMethod: 'cash',
          paymentAmount: 0,
          cashReceived: 0,
          changeAmount: 0,
          notes: '',
        }),

      getSubtotal: () => get().items.reduce((s, i) => s + i.product.sell_price * i.quantity, 0),

      getItemDiscounts: () => get().items.reduce((s, i) => s + i.discount * i.quantity, 0),

      getOrderDiscount: () => {
        const { items, discountType, discountValue } = get();
        const subtotal = items.reduce((s, i) => s + i.product.sell_price * i.quantity, 0);
        const itemDiscounts = items.reduce((s, i) => s + i.discount * i.quantity, 0);
        const afterItemDiscounts = subtotal - itemDiscounts;
        if (discountType === 'percent') return (afterItemDiscounts * discountValue) / 100;
        return discountValue;
      },

      getTax: (taxPercent) => {
        const { items, discountType, discountValue } = get();
        const subtotal = items.reduce((s, i) => s + i.product.sell_price * i.quantity, 0);
        const itemDiscounts = items.reduce((s, i) => s + i.discount * i.quantity, 0);
        const afterItemDiscounts = subtotal - itemDiscounts;
        const orderDiscount = discountType === 'percent'
          ? (afterItemDiscounts * discountValue) / 100
          : discountValue;
        const afterOrderDiscount = Math.max(0, afterItemDiscounts - orderDiscount);
        return (afterOrderDiscount * taxPercent) / 100;
      },

      getTotal: (taxPercent) => {
        const { items, discountType, discountValue } = get();
        const subtotal = items.reduce((s, i) => s + i.product.sell_price * i.quantity, 0);
        const itemDiscounts = items.reduce((s, i) => s + i.discount * i.quantity, 0);
        const afterItemDiscounts = subtotal - itemDiscounts;
        const orderDiscount = discountType === 'percent'
          ? (afterItemDiscounts * discountValue) / 100
          : discountValue;
        const afterOrderDiscount = Math.max(0, afterItemDiscounts - orderDiscount);
        const tax = (afterOrderDiscount * taxPercent) / 100;
        return afterOrderDiscount + tax;
      },

      getItemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name: 'mercury-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
