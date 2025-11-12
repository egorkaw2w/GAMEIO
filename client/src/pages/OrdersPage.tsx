// src/pages/OrdersPage.tsx
import {
    Box,
    Container,
    Typography,
    Paper,
    Chip,
    Button,
    Alert,
    Divider,
} from '@mui/material';
import { ShoppingBag, Receipt } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useStore } from '../store';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../lib/api';

interface Order {
    id: number;
    total_price: string;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
    items_count: number;
}

const OrdersPage = () => {
    const { user } = useStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) {
                setError('Необходимо войти в систему');
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/orders');
                setOrders(response.data);
            } catch (err: any) {
                console.error('Error fetching orders:', err);
                setError(err.response?.data?.error || 'Не удалось загрузить заказы');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Выполнен';
            case 'pending':
                return 'В обработке';
            case 'cancelled':
                return 'Отменён';
            default:
                return status;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Alert severity="warning">
                    Пожалуйста, войдите в систему, чтобы просмотреть историю заказов
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <ShoppingBag sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    История заказов
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {orders.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom color="text.secondary">
                        У вас пока нет заказов
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Начните с выбора игр в нашем каталоге
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        href="/catalog"
                    >
                        Перейти в каталог
                    </Button>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {orders.map((order) => (
                        <Paper
                            key={order.id}
                            elevation={2}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                transition: 'box-shadow 220ms ease',
                                '&:hover': {
                                    boxShadow: 8,
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Заказ #{order.id}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatDate(order.created_at)}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={getStatusText(order.status)}
                                    color={getStatusColor(order.status) as any}
                                    sx={{ fontWeight: 600 }}
                                />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Количество товаров
                                    </Typography>
                                    <Typography variant="h6">
                                        {order.items_count} {order.items_count === 1 ? 'товар' : 'товаров'}
                                    </Typography>
                                </Box>

                                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Сумма заказа
                                    </Typography>
                                    <Typography variant="h5" color="primary" fontWeight={700}>
                                        {parseFloat(order.total_price).toFixed(2)} ₽
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    href={`/orders/${order.id}`}
                                >
                                    Подробнее
                                </Button>
                                {order.status === 'pending' && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                    >
                                        Отменить
                                    </Button>
                                )}
                                {order.status === 'completed' && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                    >
                                        Повторить заказ
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}

            {orders.length > 0 && (
                <Paper variant="outlined" sx={{ p: 3, mt: 4, borderRadius: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Всего заказов: {orders.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        По вопросам работы с заказами обращайтесь в поддержку: support@gameio.dev
                    </Typography>
                </Paper>
            )}
        </Container>
    );
};

export default OrdersPage;
