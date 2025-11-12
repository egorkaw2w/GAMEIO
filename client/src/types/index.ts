// src/types/index.ts
export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  image?: string;
  platform: string;
  availability?: {
    accounts: number;
    keys: number;
  };
  inStock?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'manager';
}