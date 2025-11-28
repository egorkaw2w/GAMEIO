// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import RoleGuard from '../components/guards/RoleGuard';
import HomePage from '../pages/HomePage';
import CatalogPage from '../pages/CatalogPage';
import ProductPage from '../pages/ProductPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import ProfilePage from '../pages/ProfilePage';
import OrdersPage from '../pages/OrdersPage';
import SettingsPage from '../pages/SettingsPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import NotFoundPage from '../pages/NotFoundPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManagersPage from '../pages/admin/ManagersPage';
import StatisticsPage from '../pages/admin/StatisticsPage';
import DatabasePage from '../pages/admin/DatabasePage';
import LogsPage from '../pages/admin/LogsPage';
import GamesPage from '../pages/manager/GamesPage';
import AddKeyPage from '../pages/manager/AddKeyPage';
import AddAccountPage from '../pages/manager/AddAccountPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            // Пользовательские страницы (запрещены для admin и manager)
            {
                index: true,
                element: <RoleGuard blockedRoles={['admin', 'manager']}><HomePage /></RoleGuard>,
            },
            {
                path: 'catalog',
                element: <RoleGuard blockedRoles={['admin', 'manager']}><CatalogPage /></RoleGuard>,
            },
            {
                path: 'product/:id',
                element: <RoleGuard blockedRoles={['admin', 'manager']}><ProductPage /></RoleGuard>,
            },
            {
                path: 'cart',
                element: <RoleGuard blockedRoles={['admin', 'manager']}><CartPage /></RoleGuard>,
            },
            {
                path: 'checkout',
                element: <RoleGuard blockedRoles={['admin', 'manager']}><CheckoutPage /></RoleGuard>,
            },
            {
                path: 'orders',
                element: <RoleGuard blockedRoles={['admin', 'manager']}><OrdersPage /></RoleGuard>,
            },
            // Страницы доступные всем авторизованным
            {
                path: 'profile',
                element: <ProfilePage />,
            },
            {
                path: 'settings',
                element: <SettingsPage />,
            },
            // Публичные страницы (доступны всем)
            {
                path: 'login',
                element: <LoginPage />,
            },
            {
                path: 'register',
                element: <RegisterPage />,
            },
            {
                path: 'forgot-password',
                element: <ForgotPasswordPage />,
            },
            {
                path: 'reset-password',
                element: <ResetPasswordPage />,
            },
            // Панель управления (для admin и manager)
            {
                path: 'admin',
                element: <RoleGuard allowedRoles={['admin', 'manager']}><AdminDashboard /></RoleGuard>,
            },
            {
                path: 'admin/managers',
                element: <RoleGuard allowedRoles={['admin']}><ManagersPage /></RoleGuard>,
            },
            {
                path: 'admin/statistics',
                element: <RoleGuard allowedRoles={['admin', 'manager']}><StatisticsPage /></RoleGuard>,
            },
            {
                path: 'admin/database',
                element: <RoleGuard allowedRoles={['admin']}><DatabasePage /></RoleGuard>,
            },
            {
                path: 'admin/logs',
                element: <RoleGuard allowedRoles={['admin']}><LogsPage /></RoleGuard>,
            },
            // Панель менеджера (для admin и manager)
            {
                path: 'manager/games',
                element: <RoleGuard allowedRoles={['admin', 'manager']}><GamesPage /></RoleGuard>,
            },
            {
                path: 'manager/add-key',
                element: <RoleGuard allowedRoles={['admin', 'manager']}><AddKeyPage /></RoleGuard>,
            },
            {
                path: 'manager/add-account',
                element: <RoleGuard allowedRoles={['admin', 'manager']}><AddAccountPage /></RoleGuard>,
            },
            {
                path: '*',
                element: <NotFoundPage />,
            },
        ],
    },
]);
