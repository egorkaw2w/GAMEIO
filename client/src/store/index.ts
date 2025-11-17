// src/store/index.ts
import { create } from 'zustand';
import type { CartItem, User } from '../types';

interface Store {
  user: User | null;
  cart: CartItem[];
  setUser: (user: User | null) => void;
  logout: () => void;
  addToCart: (product: CartItem) => void;
  removeFromCart: (id: number, itemType: 'key' | 'account') => void;
  clearCart: () => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  cart: [],
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, cart: [] }),
  addToCart: (product) =>
    set((state) => {
      // Ищем товар с таким же id И типом (ключ/аккаунт)
      const existing = state.cart.find((i) => i.id === product.id && i.itemType === product.itemType);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.id === product.id && i.itemType === product.itemType
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { cart: [...state.cart, { ...product, quantity: 1 }] };
    }),
  removeFromCart: (id, itemType) =>
    set((state) => ({ cart: state.cart.filter((i) => !(i.id === id && i.itemType === itemType)) })),
  clearCart: () => set({ cart: [] }),
}));