// src/pages/CheckoutPage.tsx
import { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    FormControl,
    FormControlLabel,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from '@mui/material';
import {
    CreditCard,
    AccountBalance,
    CheckCircle,
    ShoppingCart,
    VpnKey,
    AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../lib/api';

type PaymentMethod = 'card' | 'sbp';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { cart, clearCart, user } = useStore();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Данные карты
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');

    // Данные СБП
    const [phone, setPhone] = useState('');

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const handlePayment = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Валидация
        if (paymentMethod === 'card') {
            if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
                setError('Заполните все поля карты');
                return;
            }
            if (cardNumber.replace(/\s/g, '').length !== 16) {
                setError('Номер карты должен содержать 16 цифр');
                return;
            }
            if (cvv.length !== 3) {
                setError('CVV должен содержать 3 цифры');
                return;
            }
        } else if (paymentMethod === 'sbp') {
            if (!phone) {
                setError('Введите номер телефона');
                return;
            }
            if (phone.replace(/\D/g, '').length !== 11) {
                setError('Введите корректный номер телефона');
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const items = cart.map(item => ({
                game_id: item.id,
                item_type: item.itemType,
            }));

            // Создаём заказ
            await api.post('/orders', { items });

            // Имитация оплаты (в реальном проекте здесь был бы вызов платёжного шлюза)
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSuccess(true);
            clearCart();

            // Перенаправляем на страницу заказов через 3 секунды
            setTimeout(() => {
                navigate('/orders');
            }, 3000);
        } catch (err: any) {
            console.error('Error during checkout:', err);
            setError(err.response?.data?.error || 'Не удалось оформить заказ. Попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    const formatExpiryDate = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const formatPhoneNumber = (value: string) => {
        // Убираем все нецифровые символы
        const digits = value.replace(/\D/g, '');

        // Если пользователь стёр всё, возвращаем пустую строку
        if (digits.length === 0) {
            return '';
        }

        // Берём только цифры после 7 (или 8)
        let phoneDigits = digits;
        if (digits.startsWith('8')) {
            phoneDigits = '7' + digits.slice(1);
        } else if (!digits.startsWith('7')) {
            phoneDigits = '7' + digits;
        }

        // Ограничиваем до 11 цифр (7 + 10 цифр номера)
        phoneDigits = phoneDigits.slice(0, 11);

        // Форматируем: +7 (XXX) XXX-XX-XX
        let formatted = '+7';

        if (phoneDigits.length > 1) {
            formatted += ' (' + phoneDigits.slice(1, 4);
        }
        if (phoneDigits.length >= 5) {
            formatted += ') ' + phoneDigits.slice(4, 7);
        }
        if (phoneDigits.length >= 8) {
            formatted += '-' + phoneDigits.slice(7, 9);
        }
        if (phoneDigits.length >= 10) {
            formatted += '-' + phoneDigits.slice(9, 11);
        }

        return formatted;
    };

    if (!user) {
        navigate('/login');
        return <LoadingSpinner />;
    }

    if (cart.length === 0) {
        navigate('/cart');
        return <LoadingSpinner />;
    }

    if (success) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                    <Typography variant="h3" gutterBottom fontWeight={700}>
                        Оплата прошла успешно!
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                        Заказ оформлен
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 4 }}>
                        Спасибо за покупку! Ключи доступны в разделе "Мои заказы"
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Автоматическое перенаправление...
                    </Typography>
                </Paper>
            </Container>
        );
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <ShoppingCart sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Оформление заказа
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
                {/* Форма оплаты */}
                <Box>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h5" gutterBottom fontWeight={600}>
                            Способ оплаты
                        </Typography>

                        <FormControl fullWidth sx={{ mt: 3 }}>
                            <RadioGroup
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            >
                                <Card
                                    variant={paymentMethod === 'card' ? 'outlined' : 'elevation'}
                                    sx={{
                                        mb: 2,
                                        borderWidth: paymentMethod === 'card' ? 2 : 1,
                                        borderColor: paymentMethod === 'card' ? 'primary.main' : 'divider',
                                    }}
                                >
                                    <CardContent>
                                        <FormControlLabel
                                            value="card"
                                            control={<Radio />}
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CreditCard />
                                                    <Typography variant="h6">Банковская карта</Typography>
                                                </Box>
                                            }
                                        />
                                    </CardContent>
                                </Card>

                                <Card
                                    variant={paymentMethod === 'sbp' ? 'outlined' : 'elevation'}
                                    sx={{
                                        borderWidth: paymentMethod === 'sbp' ? 2 : 1,
                                        borderColor: paymentMethod === 'sbp' ? 'primary.main' : 'divider',
                                    }}
                                >
                                    <CardContent>
                                        <FormControlLabel
                                            value="sbp"
                                            control={<Radio />}
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <AccountBalance />
                                                    <Typography variant="h6">СБП (Система Быстрых Платежей)</Typography>
                                                </Box>
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            </RadioGroup>
                        </FormControl>

                        <Divider sx={{ my: 3 }} />

                        {/* Форма для карты */}
                        {paymentMethod === 'card' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Данные карты
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Номер карты"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    placeholder="1234 5678 9012 3456"
                                    inputProps={{ maxLength: 19 }}
                                />
                                <TextField
                                    fullWidth
                                    label="Имя держателя"
                                    value={cardHolder}
                                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                    placeholder="IVAN IVANOV"
                                />
                                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
                                    <TextField
                                        label="Срок действия"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                                        placeholder="MM/YY"
                                        inputProps={{ maxLength: 5 }}
                                    />
                                    <TextField
                                        label="CVV"
                                        type="password"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123"
                                        inputProps={{ maxLength: 3 }}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Форма для СБП */}
                        {paymentMethod === 'sbp' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Данные для СБП
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Номер телефона"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                                    placeholder="+7 (900) 123-45-67"
                                    inputProps={{ maxLength: 18 }}
                                />
                                <Alert severity="info">
                                    После нажатия "Оплатить" вам придёт push-уведомление от вашего банка
                                </Alert>
                            </Box>
                        )}
                    </Paper>
                </Box>

                {/* Итоговая информация */}
                <Box>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
                        <Typography variant="h5" gutterBottom fontWeight={600}>
                            Ваш заказ
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                            {cart.map((item, index) => (
                                <Box key={`${item.id}-${item.itemType}-${index}`}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight={500}>
                                            {item.title}
                                        </Typography>
                                        <Typography variant="body2">
                                            {item.price} ₽
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.platform}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">•</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {item.itemType === 'key' ? (
                                                <VpnKey sx={{ fontSize: 14 }} />
                                            ) : (
                                                <AccountIcon sx={{ fontSize: 14 }} />
                                            )}
                                            <Typography variant="caption" color="text.secondary">
                                                {item.itemType === 'key' ? 'Ключ' : 'Аккаунт'}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">×</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.quantity}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h6">Итого:</Typography>
                            <Typography variant="h5" color="primary" fontWeight={700}>
                                {total.toFixed(2)} ₽
                            </Typography>
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handlePayment}
                            disabled={loading}
                        >
                            {loading ? 'Обработка...' : 'Оплатить'}
                        </Button>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                            Нажимая "Оплатить", вы соглашаетесь с условиями оферты
                        </Typography>
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
};

export default CheckoutPage;
