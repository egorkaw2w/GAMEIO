// src/pages/admin/StatisticsPage.tsx
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Paper,
    Typography,
} from '@mui/material';
import { BarChart, Download } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackButton from '../../components/ui/BackButton';
import api from '../../lib/api';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OverviewStats {
    total_users: string;
    completed_orders: string;
    pending_orders: string;
    cancelled_orders: string;
    total_revenue: string;
    total_games: string;
    available_accounts: string;
    available_keys: string;
    sold_accounts: string;
    sold_keys: string;
}

interface SalesByGame {
    game_id: number;
    game_title: string;
    platform_name: string;
    orders_count: string;
    items_sold: string;
    total_revenue: string;
}

interface SalesByPeriod {
    period: string;
    orders_count: string;
    total_revenue: string;
}

const StatisticsPage = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
    const [salesByGame, setSalesByGame] = useState<SalesByGame[]>([]);
    const [salesByPeriod, setSalesByPeriod] = useState<SalesByPeriod[]>([]);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchStatistics();
    }, [user, navigate]);

    const fetchStatistics = async () => {
        try {
            const [overviewRes, salesByGameRes, salesByPeriodRes] = await Promise.all([
                api.get('/statistics/overview'),
                api.get('/statistics/sales-by-game?limit=10'),
                api.get('/statistics/sales-by-period?period=day'),
            ]);
            setOverviewStats(overviewRes.data);
            setSalesByGame(salesByGameRes.data);
            setSalesByPeriod(salesByPeriodRes.data);
        } catch (err: any) {
            console.error('Error fetching statistics:', err);
            setError(err.response?.data?.error || 'Не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async (type: string) => {
        try {
            const response = await api.get(`/export/${type}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setSuccess(`Данные ${type} успешно экспортированы!`);
        } catch (err: any) {
            console.error('Error exporting:', err);
            setError(`Не удалось экспортировать ${type}`);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
            <BackButton to="/admin" />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <BarChart sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Статистика и аналитика
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleExportCSV('statistics')}
                    size="small"
                >
                    Экспорт статистики
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleExportCSV('orders')}
                    size="small"
                >
                    Экспорт заказов
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleExportCSV('users')}
                    size="small"
                >
                    Экспорт пользователей
                </Button>
            </Box>

            {overviewStats && (
                <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Всего пользователей
                                </Typography>
                                <Typography variant="h4" fontWeight={700}>
                                    {overviewStats.total_users}
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Выполнено заказов
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="success.main">
                                    {overviewStats.completed_orders}
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Общая выручка
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="primary.main">
                                    {parseFloat(overviewStats.total_revenue).toFixed(2)} ₽
                                </Typography>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Доступно товаров
                                </Typography>
                                <Typography variant="h4" fontWeight={700}>
                                    {parseInt(overviewStats.available_keys) + parseInt(overviewStats.available_accounts)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Продажи по периодам
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={salesByPeriod}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="total_revenue" stroke="#8884d8" name="Выручка (₽)" />
                                    <Line type="monotone" dataKey="orders_count" stroke="#82ca9d" name="Заказов" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>

                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Топ-10 игр по продажам
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsBarChart data={salesByGame.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="game_title" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total_revenue" fill="#8884d8" name="Выручка (₽)" />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Статус инвентаря
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography color="text.secondary">
                                            Доступно ключей
                                        </Typography>
                                        <Typography variant="h5" color="primary.main">
                                            {overviewStats.available_keys}
                                        </Typography>
                                    </CardContent>
                                </Card>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography color="text.secondary">
                                            Продано ключей
                                        </Typography>
                                        <Typography variant="h5" color="success.main">
                                            {overviewStats.sold_keys}
                                        </Typography>
                                    </CardContent>
                                </Card>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography color="text.secondary">
                                            Доступно аккаунтов
                                        </Typography>
                                        <Typography variant="h5" color="primary.main">
                                            {overviewStats.available_accounts}
                                        </Typography>
                                    </CardContent>
                                </Card>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography color="text.secondary">
                                            Продано аккаунтов
                                        </Typography>
                                        <Typography variant="h5" color="success.main">
                                            {overviewStats.sold_accounts}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Paper>
                    </Box>
                </>
            )}
        </Container>
    );
};

export default StatisticsPage;
