// src/features/products/hooks/useProducts.ts
import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import type { Product } from '../../../types';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        const fetchProducts = async () => {
            try {
                const response = await api.get<Product[]>('/products');
                if (!ignore) {
                    setProducts(response.data);
                    setError(null);
                }
            } catch (err) {
                console.error('Не удалось загрузить каталог', err);
                if (!ignore) {
                    setError('Не удалось загрузить каталог. Попробуйте обновить страницу позже.');
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchProducts();

        return () => {
            ignore = true;
        };
    }, []);

    return { products, loading, error };
};