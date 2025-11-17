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
    const { logout } = useStore();

    // Навигация
    useHotkeys('ctrl+h', (e) => {
        e.preventDefault();
        navigate('/');
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
            <Footer />
            <HotkeysHelper />
        </Box>
    );
};

export default Layout;
