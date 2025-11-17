// src/pages/CartPage.tsx
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Container,
    Divider,
    IconButton,
    Paper,
    Typography,
} from '@mui/material';
import {
    ShoppingCart,
    Delete,
    ArrowBack,
    VpnKey,
    AccountCircle,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useState } from 'react';

const CartPage = () => {
    const navigate = useNavigate();
    const { cart, removeFromCart, clearCart, user } = useStore();
    const [error, setError] = useState<string | null>(null);

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const handleCheckout = () => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Переходим на страницу оформления заказа
        navigate('/checkout');
    };

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Корзина доступна после входа
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Войдите в систему, чтобы оформить заказ
                    </Typography>
                    <Button variant="contained" size="large" component={RouterLink} to="/login">
                        Авторизоваться
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <ShoppingCart sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Корзина
                </Typography>
            </Box>

            <Button
                startIcon={<ArrowBack />}
                component={RouterLink}
                to="/catalog"
                sx={{ mb: 3 }}
            >
                Продолжить покупки
            </Button>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {cart.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom color="text.secondary">
                        Ваша корзина пуста
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Перейдите в каталог, чтобы выбрать игры
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
                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: {
                            xs: 'repeat(1, minmax(0, 1fr))',
                            md: '2fr 1fr',
                        },
                    }}
                >
                    {/* Список товаров */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {cart.map((item) => (
                            <Card
                                key={`${item.id}-${item.itemType}`}
                                sx={{
                                    display: 'flex',
                                    borderRadius: 3,
                                    transition: 'box-shadow 220ms ease',
                                    '&:hover': {
                                        boxShadow: 8,
                                    },
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    sx={{ width: 160, objectFit: 'cover' }}
                                    image={item.image || `https://placehold.co/160x120?text=${encodeURIComponent(item.title)}`}
                                    alt={item.title}
                                />
                                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    <CardContent sx={{ flex: '1 0 auto' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography component="h6" variant="h6">
                                                {item.title}
                                            </Typography>
                                            <IconButton
                                                color="error"
                                                onClick={() => removeFromCart(item.id, item.itemType)}
                                                size="small"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                            <Chip
                                                label={item.platform}
                                                size="small"
                                                color="primary"
                                            />
                                            <Chip
                                                icon={item.itemType === 'key' ? <VpnKey /> : <AccountCircle />}
                                                label={item.itemType === 'key' ? 'Ключ' : 'Аккаунт'}
                                                size="small"
                                                color={item.itemType === 'key' ? 'secondary' : 'success'}
                                                variant="outlined"
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Количество: {item.quantity}
                                            </Typography>
                                            <Typography variant="h6" color="primary" fontWeight={700}>
                                                {(item.price * item.quantity).toFixed(2)} ₽
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Box>
                            </Card>
                        ))}

                        <Button
                            variant="outlined"
                            color="error"
                            onClick={clearCart}
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            Очистить корзину
                        </Button>
                    </Box>

                    {/* Итоговая информация */}
                    <Box sx={{ position: 'sticky', top: 20, height: 'fit-content' }}>
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h5" gutterBottom fontWeight={600}>
                                Итого
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">
                                        Товаров:
                                    </Typography>
                                    <Typography fontWeight={600}>
                                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">
                                        Сумма:
                                    </Typography>
                                    <Typography fontWeight={600}>
                                        {total.toFixed(2)} ₽
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">
                                        К оплате:
                                    </Typography>
                                    <Typography variant="h4" color="primary" fontWeight={700}>
                                        {total.toFixed(2)} ₽
                                    </Typography>
                                </Box>
                            </Box>

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                sx={{ mb: 2 }}
                            >
                                Перейти к оплате
                            </Button>

                            <Typography variant="caption" color="text.secondary" align="center" display="block">
                                Нажимая кнопку, вы соглашаетесь с условиями использования
                            </Typography>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 3 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Безопасная оплата</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Все платежи защищены. Мгновенная доставка после оплаты.
                            </Typography>
                        </Paper>
                    </Box>
                </Box>
            )}
        </Container>
    );
};

export default CartPage;
