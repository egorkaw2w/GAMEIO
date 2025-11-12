// src/store/index.ts
import { create } from 'zustand';
import type { CartItem, User } from '../types';

interface Store {
  user: User | null;
  cart: CartItem[];
  setUser: (user: User | null) => void;
  logout: () => void;
  addToCart: (product: CartItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  cart: [],
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, cart: [] }),
  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((i) => i.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { cart: [...state.cart, { ...product, quantity: 1 }] };
    }),
  removeFromCart: (id) =>
    set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),
  clearCart: () => set({ cart: [] }),
}));