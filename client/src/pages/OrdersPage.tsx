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
    Collapse,
    IconButton,
    List,
    ListItem,
    Stack,
} from '@mui/material';
import {
    ShoppingBag,
    Receipt,
    ExpandMore,
    ExpandLess,
    Visibility,
    Key as KeyIcon,
    AccountCircle,
    ContentCopy,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../lib/api';

interface OrderItem {
    id: number;
    item_type: 'account' | 'key';
    item_id: number;
    quantity: number;
    product_details: {
        id: number;
        game_id: number;
        game_title: string;
        platform_id: number;
        platform_name: string;
        price: string;
        login?: string;
        password?: string;
        additional_info?: string;
        key_code?: string;
        region?: string;
    };
}

interface Order {
    id: number;
    total_price: string;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
    items_count: number;
    items?: OrderItem[];
}

const OrdersPage = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
    const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

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

    const toggleOrderDetails = async (orderId: number) => {
        const isExpanded = expandedOrders.has(orderId);

        if (isExpanded) {
            // Сворачиваем
            const newExpanded = new Set(expandedOrders);
            newExpanded.delete(orderId);
            setExpandedOrders(newExpanded);
        } else {
            // Разворачиваем и загружаем детали, если еще не загружены
            const order = orders.find(o => o.id === orderId);
            if (!order?.items) {
                setLoadingDetails(prev => new Set([...prev, orderId]));
                try {
                    const response = await api.get(`/orders/${orderId}`);
                    setOrders(prevOrders =>
                        prevOrders.map(o =>
                            o.id === orderId ? { ...o, items: response.data.items } : o
                        )
                    );
                } catch (err: any) {
                    console.error('Error fetching order details:', err);
                    setError(err.response?.data?.error || 'Не удалось загрузить детали заказа');
                } finally {
                    setLoadingDetails(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(orderId);
                        return newSet;
                    });
                }
            }

            const newExpanded = new Set(expandedOrders);
            newExpanded.add(orderId);
            setExpandedOrders(newExpanded);
        }
    };

    const handleCopyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(label);
            setTimeout(() => setCopySuccess(null), 2000);
        });
    };

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
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {copySuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {copySuccess} скопировано в буфер обмена
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
                        component={RouterLink}
                        to="/catalog"
                    >
                        Перейти в каталог
                    </Button>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {orders.map((order) => {
                        const isExpanded = expandedOrders.has(order.id);
                        const isLoadingDetails = loadingDetails.has(order.id);

                        return (
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

                                <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                                        onClick={() => toggleOrderDetails(order.id)}
                                        disabled={isLoadingDetails}
                                    >
                                        {isLoadingDetails ? 'Загрузка...' : isExpanded ? 'Скрыть товары' : 'Показать товары'}
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
                                </Box>

                                {/* Развернутый список товаров */}
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <Divider sx={{ my: 3 }} />
                                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                        Товары в заказе:
                                    </Typography>
                                    {order.items && order.items.length > 0 ? (
                                        <List sx={{ bgcolor: 'background.default', borderRadius: 2 }}>
                                            {order.items.map((item, index) => (
                                                <ListItem
                                                    key={item.id}
                                                    sx={{
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-start',
                                                        borderBottom: index < order.items!.length - 1 ? 1 : 0,
                                                        borderColor: 'divider',
                                                        py: 2,
                                                    }}
                                                >
                                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {item.item_type === 'account' ? (
                                                                <AccountCircle color="primary" />
                                                            ) : (
                                                                <KeyIcon color="secondary" />
                                                            )}
                                                            <Box>
                                                                <Typography variant="subtitle1" fontWeight={600}>
                                                                    {item.product_details.game_title}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {item.product_details.platform_name} • {item.item_type === 'account' ? 'Аккаунт' : 'Ключ'}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                        <Typography variant="h6" color="primary">
                                                            {parseFloat(item.product_details.price).toFixed(2)} ₽
                                                        </Typography>
                                                    </Box>

                                                    {/* Данные для аккаунта */}
                                                    {item.item_type === 'account' && order.status === 'completed' && (
                                                        <Paper variant="outlined" sx={{ p: 2, width: '100%', bgcolor: 'rgba(76, 175, 80, 0.08)' }}>
                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                Данные для входа:
                                                            </Typography>
                                                            <Stack spacing={1}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="body2" fontWeight={600}>
                                                                        Логин:пароль:
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            fontFamily: 'monospace',
                                                                            bgcolor: 'background.paper',
                                                                            px: 1,
                                                                            py: 0.5,
                                                                            borderRadius: 1,
                                                                            flex: 1
                                                                        }}
                                                                    >
                                                                        {item.product_details.login}:{item.product_details.password}
                                                                    </Typography>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleCopyToClipboard(
                                                                            `${item.product_details.login}:${item.product_details.password}`,
                                                                            'Данные аккаунта'
                                                                        )}
                                                                    >
                                                                        <ContentCopy fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                                {item.product_details.additional_info && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Доп. информация: {item.product_details.additional_info}
                                                                    </Typography>
                                                                )}
                                                            </Stack>
                                                        </Paper>
                                                    )}

                                                    {/* Данные для ключа */}
                                                    {item.item_type === 'key' && order.status === 'completed' && (
                                                        <Paper variant="outlined" sx={{ p: 2, width: '100%', bgcolor: 'rgba(33, 150, 243, 0.08)' }}>
                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                Ключ активации:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography
                                                                    variant="body1"
                                                                    sx={{
                                                                        fontFamily: 'monospace',
                                                                        fontWeight: 600,
                                                                        bgcolor: 'background.paper',
                                                                        px: 2,
                                                                        py: 1,
                                                                        borderRadius: 1,
                                                                        flex: 1
                                                                    }}
                                                                >
                                                                    {item.product_details.key_code}
                                                                </Typography>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleCopyToClipboard(
                                                                        item.product_details.key_code || '',
                                                                        'Ключ активации'
                                                                    )}
                                                                >
                                                                    <ContentCopy fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                            {item.product_details.region && (
                                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                                    Регион: {item.product_details.region}
                                                                </Typography>
                                                            )}
                                                        </Paper>
                                                    )}

                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        startIcon={<Visibility />}
                                                        onClick={() => navigate(`/product/${item.product_details.game_id}`)}
                                                        sx={{ mt: 2 }}
                                                    >
                                                        Перейти к товару
                                                    </Button>
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography color="text.secondary">
                                            Информация о товарах недоступна
                                        </Typography>
                                    )}
                                </Collapse>
                            </Paper>
                        );
                    })}
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
