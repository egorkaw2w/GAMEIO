import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import type { Product } from '../../../types';

export const useProduct = (id: number | null) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Товар не найден');
      setLoading(false);
      return;
    }

    let ignore = false;

    const fetchProduct = async () => {
      try {
        const response = await api.get<Product>(`/products/${id}`);
        if (!ignore) {
          setProduct(response.data);
          setError(null);
        }
      } catch (err) {
        console.error('Не удалось загрузить товар', err);
        if (!ignore) {
          setError('Не удалось загрузить информацию о товаре. Попробуйте позже.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      ignore = true;
    };
  }, [id]);

  return { product, loading, error };
};

