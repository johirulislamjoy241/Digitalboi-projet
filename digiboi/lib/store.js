import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── AUTH STORE ───────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null, shop: null, token: null, lang: 'bn',
      setAuth: (user, shop, token) => set({ user, shop, token }),
      setLang: (lang) => set({ lang }),
      logout: () => {
        set({ user: null, shop: null, token: null });
        document.cookie = 'digiboi_token=; path=/; max-age=0';
        window.location.href = '/auth/login';
      },
    }),
    { name: 'digiboi-auth' }
  )
);

// ─── TRANSLATION HELPER ───────────────────────────────────
export function useLang() {
  const lang = useAuthStore(s => s.lang);
  return { lang, t: (bn, en) => lang === 'en' ? (en || bn) : bn };
}

// ─── CART STORE (POS) ─────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  paymentMethod: 'cash',
  customerId: null,
  customerName: '',
  notes: '',

  addItem: (product, qty = 1) => {
    const items = get().items;
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      set({ items: items.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i) });
    } else {
      set({ items: [...items, { ...product, qty }] });
    }
  },

  removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),

  updateQty: (id, qty) => {
    if (qty <= 0) set({ items: get().items.filter(i => i.id !== id) });
    else set({ items: get().items.map(i => i.id === id ? { ...i, qty } : i) });
  },

  setDiscount: (d) => set({ discount: Number(d)||0 }),
  setPaymentMethod: (m) => set({ paymentMethod: m }),
  setCustomer: (id, name) => set({ customerId: id, customerName: name||'' }),
  setNotes: (n) => set({ notes: n }),

  // BUG FIX: selling_price=0 এর জন্য ?? ব্যবহার করা হয়েছে, || নয়
  getSubtotal: () => get().items.reduce((s, i) => s + (Number(i.selling_price) ?? 0) * (Number(i.qty) ?? 1), 0),
  getTotal: () => Math.max(0, get().items.reduce((s, i) => s + (Number(i.selling_price) ?? 0) * (Number(i.qty) ?? 1), 0) - (get().discount ?? 0)),

  clearCart: () => set({ items: [], discount: 0, paymentMethod: 'cash', customerId: null, customerName: '', notes: '' }),
}));

// ─── TOAST STORE ──────────────────────────────────────────
export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (msg, type = 'success') => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500);
  },
}));

// ─── NOTIFICATION STORE (alias for toast) ─────────────────
export const useNotifStore = create((set) => ({
  notifs: [],
  addNotif: (msg, type = 'info') => {
    const id = Date.now();
    set(s => ({ notifs: [...s.notifs, { id, msg, type }] }));
    setTimeout(() => set(s => ({ notifs: s.notifs.filter(n => n.id !== id) })), 3500);
  },
}));
