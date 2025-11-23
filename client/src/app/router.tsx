// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';
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
import GamesPage from '../pages/manager/GamesPage';
import AddKeyPage from '../pages/manager/AddKeyPage';
import AddAccountPage from '../pages/manager/AddAccountPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
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
            {
                path: 'catalog',
                element: <CatalogPage />,
            },
            {
                path: 'product/:id',
                element: <ProductPage />,
            },
            {
                path: 'cart',
                element: <CartPage />,
            },
            {
                path: 'checkout',
                element: <CheckoutPage />,
            },
            {
                path: 'profile',
                element: <ProfilePage />,
            },
            {
                path: 'orders',
                element: <OrdersPage />,
            },
            {
                path: 'settings',
                element: <SettingsPage />,
            },
            {
                path: 'admin',
                element: <AdminDashboard />,
            },
            {
                path: 'admin/managers',
                element: <ManagersPage />,
            },
            {
                path: 'admin/statistics',
                element: <StatisticsPage />,
            },
            {
                path: 'admin/database',
                element: <DatabasePage />,
            },
            {
                path: 'manager/games',
                element: <GamesPage />,
            },
            {
                path: 'manager/add-key',
                element: <AddKeyPage />,
            },
            {
                path: 'manager/add-account',
                element: <AddAccountPage />,
            },
            {
                path: '*',
                element: <NotFoundPage />,
            },
        ],
    },
]);
