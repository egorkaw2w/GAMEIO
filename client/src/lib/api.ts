import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок 401 (невалидный/истекший токен)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Очищаем localStorage при ошибке авторизации
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Перенаправляем на страницу входа только если не находимся на публичных страницах
      const publicPaths = ['/login', '/register', '/', '/catalog', '/product'];
      const currentPath = window.location.pathname;
      const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));

      if (!isPublicPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

