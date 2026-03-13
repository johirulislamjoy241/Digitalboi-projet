import { create } from 'zustand';

// ── AUTH STORE ─────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user:  null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
}));

// ── TOAST STORE ────────────────────────────────────────
export const useToastStore = create((set, get) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Date.now() + Math.random();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 3500);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

// ── CART STORE ─────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  paymentMethod: 'cash',
  customerId: null,
  customerName: '',
  notes: '',

  addItem: (product) => {
    const items = get().items;
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      set({ items: items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) });
    } else {
      set({ items: [...items, { ...product, qty: 1 }] });
    }
  },

  updateQty: (id, delta) => {
    const items = get().items
      .map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
      .filter(i => i.qty > 0);
    set({ items });
  },

  setQty: (id, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter(i => i.id !== id) });
    } else {
      set({ items: get().items.map(i => i.id === id ? { ...i, qty } : i) });
    }
  },

  removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),

  clearCart: () => set({ items: [], discount: 0, customerId: null, customerName: '', paymentMethod: 'cash', notes: '' }),

  getSubtotal: () => get().items.reduce((s, i) => s + (Number(i.selling_price) || 0) * i.qty, 0),
  getDiscount: () => {
    const sub = get().getSubtotal();
    return Math.floor(sub * (get().discount / 100));
  },
  getTotal: () => get().getSubtotal() - get().getDiscount(),
}));
