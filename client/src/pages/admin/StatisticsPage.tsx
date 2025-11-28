// src/pages/admin/StatisticsPage.tsx
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Typography,
} from '@mui/material';
import { BarChart, Download, PictureAsPdf, TableChart } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackButton from '../../components/ui/BackButton';
import api from '../../lib/api';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportType, setExportType] = useState<string>('');

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

    const openExportDialog = (type: string) => {
        setExportType(type);
        setExportDialogOpen(true);
    };

    const handleExport = async (format: 'csv' | 'pdf') => {
        try {
            const endpoint = format === 'pdf' ? `/export/${exportType}/pdf` : `/export/${exportType}`;

            if (format === 'pdf') {
                // Для PDF открываем в новом окне и автоматически вызываем диалог печати
                const response = await api.get(endpoint);
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                    // Добавляем скрипт для автоматического открытия диалога печати
                    const htmlWithPrint = response.data.replace(
                        '</body>',
                        `<script>
                            window.onload = function() {
                                // Небольшая задержка для загрузки стилей
                                setTimeout(function() {
                                    window.print();
                                }, 500);
                            };
                        </script>
                        <div style="position: fixed; top: 10px; right: 10px; z-index: 9999;">
                            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #667eea; color: white; border: none; border-radius: 5px;">
                                Сохранить как PDF
                            </button>
                        </div>
                        </body>`
                    );
                    newWindow.document.write(htmlWithPrint);
                    newWindow.document.close();
                }
                setSuccess(`Откроется диалог сохранения. Выберите "Сохранить как PDF" или "Microsoft Print to PDF".`);
            } else {
                // Для CSV скачиваем файл
                const response = await api.get(endpoint, {
                    responseType: 'blob',
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${exportType}.${format}`);
                document.body.appendChild(link);
                link.click();
                link.remove();

                setSuccess(`Данные ${exportType} успешно экспортированы в ${format.toUpperCase()}!`);
            }

            setExportDialogOpen(false);
        } catch (err: any) {
            console.error('Error exporting:', err);
            setError(`Не удалось экспортировать ${exportType}`);
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
                    onClick={() => openExportDialog('statistics')}
                    size="small"
                >
                    Экспорт статистики
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => openExportDialog('orders')}
                    size="small"
                >
                    Экспорт заказов
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => openExportDialog('users')}
                    size="small"
                >
                    Экспорт пользователей
                </Button>
            </Box>

            {/* Диалог выбора формата экспорта */}
            <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
                <DialogTitle>Выберите формат экспорта</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<TableChart />}
                            onClick={() => handleExport('csv')}
                            fullWidth
                            size="large"
                        >
                            Экспорт в CSV
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<PictureAsPdf />}
                            onClick={() => handleExport('pdf')}
                            fullWidth
                            size="large"
                            color="error"
                        >
                            Экспорт в PDF
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportDialogOpen(false)}>
                        Отмена
                    </Button>
                </DialogActions>
            </Dialog>

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
                                Распределение продаж по типам
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Проданные ключи', value: parseInt(overviewStats.sold_keys) },
                                            { name: 'Проданные аккаунты', value: parseInt(overviewStats.sold_accounts) },
                                            { name: 'Доступные ключи', value: parseInt(overviewStats.available_keys) },
                                            { name: 'Доступные аккаунты', value: parseInt(overviewStats.available_accounts) }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        <Cell fill="#82ca9d" />
                                        <Cell fill="#8884d8" />
                                        <Cell fill="#ffc658" />
                                        <Cell fill="#ff8042" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
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
