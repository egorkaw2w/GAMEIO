import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '../../../lib/api';
import type { LoginFormValues, RegisterFormValues } from '../../../lib/validation';
import type { User } from '../../../types';
import { useStore } from '../../../store';

type AuthError = string | null;

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiMessage =
      (typeof error.response?.data === 'string' && error.response.data) ||
      (error.response?.data as { error?: string })?.error;
    if (apiMessage) return apiMessage;
    if (error.message === 'Network Error') return 'Сервер недоступен';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Неизвестная ошибка';
};

export const useAuth = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !storedUser) return;
    try {
      const parsed: User = JSON.parse(storedUser);
      setUser(parsed);
    } catch (err) {
      console.warn('Не удалось восстановить пользователя из localStorage', err);
      localStorage.removeItem('user');
    }
  }, [setUser]);

  const handleAuthSuccess = useCallback(
    (token: string, payload: Partial<User>) => {
      const normalizedUser: User = {
        id: payload.id ?? 0,
        username: payload.username ?? '',
        email: payload.email ?? '',
        role: payload.role ?? 'user',
      };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    },
    [setUser],
  );

  const login = useCallback(
    async (values: LoginFormValues) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post('/auth/login', values);
        handleAuthSuccess(data.token, {
          ...data.user,
          email: data.user?.email ?? values.email,
        });
      } catch (err) {
        setError(extractErrorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const register = useCallback(
    async (values: RegisterFormValues) => {
      setLoading(true);
      setError(null);
      try {
        const { confirmPassword, ...payload } = values;
        const { data } = await api.post('/auth/register', payload);
        handleAuthSuccess(data.token, {
          ...data.user,
          email: payload.email,
        });
      } catch (err) {
        setError(extractErrorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, [setUser]);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };
};

