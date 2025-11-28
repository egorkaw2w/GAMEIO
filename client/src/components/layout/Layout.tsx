// src/components/layout/Layout.tsx
import { Box } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import Header from './Header';
import Footer from './Footer';
import HotkeysHelper from '../ui/HotkeysHelper';
import { useStore } from '../../store';

const Layout = () => {
    const navigate = useNavigate();
    const { user, logout } = useStore();

    // Проверяем, является ли пользователь админом или менеджером
    const isAdminOrManager = user && (user.role === 'admin' || user.role === 'manager');

    // Определяем главную страницу в зависимости от роли
    const getHomePage = () => {
        if (user?.role === 'admin') return '/admin';
        if (user?.role === 'manager') return '/admin';
        return '/';
    };

    // Навигация
    useHotkeys('ctrl+h', (e) => {
        e.preventDefault();
        navigate(getHomePage());
    }, { description: 'Перейти на главную страницу' });

    useHotkeys('ctrl+p', (e) => {
        e.preventDefault();
        navigate('/profile');
    }, { description: 'Перейти в профиль' });

    useHotkeys('ctrl+b', (e) => {
        e.preventDefault();
        navigate('/cart');
    }, { description: 'Перейти в корзину' });

    useHotkeys('ctrl+o', (e) => {
        e.preventDefault();
        navigate('/orders');
    }, { description: 'Перейти к заказам' });

    // Выход
    useHotkeys('ctrl+l', (e) => {
        e.preventDefault();
        if (confirm('Вы уверены, что хотите выйти?')) {
            logout();
            localStorage.removeItem('token');
            navigate('/login');
        }
    }, { description: 'Выход из системы' });

    // Справка
    useHotkeys('ctrl+/', (e) => {
        e.preventDefault();
        // Подсказка показывается при наведении на кнопку
    }, { description: 'Показать справку' });

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Box component="main" sx={{ flexGrow: 1 }}>
                <Outlet />
            </Box>
            {/* Футер скрыт для админа и менеджера */}
            {!isAdminOrManager && <Footer />}
            <HotkeysHelper />
        </Box>
    );
};

export default Layout;
