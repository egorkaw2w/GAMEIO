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
  min_account_price?: number;
  min_key_price?: number;
  inStock?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  itemType: 'key' | 'account'; // Тип товара: ключ или аккаунт
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'manager';
}