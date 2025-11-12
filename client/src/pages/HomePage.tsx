// src/pages/HomePage.tsx
import {
    Box,
    Button,
    Container,
    Fade,
    Paper,
    Typography,
    Card,
    CardContent,
    CardMedia,
    Chip,
} from '@mui/material';
import {
    Speed,
    Security,
    CardGiftcard,
    TrendingUp,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useProducts } from '../features/products/hooks/useProducts';
import { useStore } from '../store';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const HomePage = () => {
    const { products, loading } = useProducts();
    const { addToCart } = useStore();

    // Показываем первые 6 игр как популярные
    const featuredProducts = products.slice(0, 6);

    return (
        <Fade in timeout={500}>
            <Container sx={{ py: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Hero Section */}
                <Paper
                    elevation={16}
                    sx={{
                        p: { xs: 4, md: 6 },
                        textAlign: 'center',
                        borderRadius: 4,
                        background: (theme) =>
                            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        color: 'common.white',
                    }}
                >
                    <Typography variant="overline" sx={{ letterSpacing: 3, fontSize: '0.875rem' }}>
                        цифровой маркетплейс
                    </Typography>
                    <Typography variant="h2" component="h1" sx={{ mb: 2, mt: 1, fontWeight: 700 }}>
                        GameIO
                    </Typography>
                    <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
                        Покупайте ключи и аккаунты Steam, PlayStation, Xbox, Nintendo и других площадок
                        с мгновенной доставкой и защитой сделок.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="large"
                            color="inherit"
                            component={Link}
                            to="/catalog"
                            sx={{ color: 'common.black', fontWeight: 600, px: 5 }}
                        >
                            Перейти в каталог
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            color="inherit"
                            component={Link}
                            to="/register"
                            sx={{ borderColor: 'common.white', color: 'common.white', px: 5 }}
                        >
                            Регистрация
                        </Button>
                    </Box>
                </Paper>

                {/* Features Section */}
                <Box>
                    <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
                        Почему выбирают нас?
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 3,
                            gridTemplateColumns: {
                                xs: 'repeat(1, minmax(0, 1fr))',
                                sm: 'repeat(2, minmax(0, 1fr))',
                                md: 'repeat(3, minmax(0, 1fr))',
                            },
                        }}
                    >
                        {[
                            {
                                icon: <Speed sx={{ fontSize: 48 }} />,
                                title: 'Мгновенная доставка',
                                description: 'Коды приходят на почту и в личный кабинет сразу после оплаты.',
                            },
                            {
                                icon: <Security sx={{ fontSize: 48 }} />,
                                title: 'Гарантия и поддержка 24/7',
                                description: 'Если что-то пошло не так — мы вернём деньги или подберём замену.',
                            },
                            {
                                icon: <CardGiftcard sx={{ fontSize: 48 }} />,
                                title: 'Бонусы за каждую покупку',
                                description: 'Получайте кешбэк баллами и обменяйте их на скидки до 20%.',
                            },
                        ].map((feature) => (
                            <Paper
                                key={feature.title}
                                elevation={3}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 2,
                                    borderRadius: 3,
                                    textAlign: 'center',
                                    transition: 'transform 220ms ease, box-shadow 220ms ease',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: 12,
                                    },
                                }}
                            >
                                <Box sx={{ color: 'primary.main' }}>{feature.icon}</Box>
                                <Typography variant="h5" fontWeight={600}>
                                    {feature.title}
                                </Typography>
                                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                    {feature.description}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                </Box>

                {/* Popular Products Section */}
                {loading ? (
                    <LoadingSpinner />
                ) : featuredProducts.length > 0 ? (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                            <TrendingUp sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                Популярные игры
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 3,
                                gridTemplateColumns: {
                                    xs: 'repeat(1, minmax(0, 1fr))',
                                    sm: 'repeat(2, minmax(0, 1fr))',
                                    md: 'repeat(3, minmax(0, 1fr))',
                                },
                            }}
                        >
                            {featuredProducts.map((product) => (
                                <Card
                                    key={product.id}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 3,
                                        transition: 'transform 220ms ease, box-shadow 220ms ease',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: 12,
                                        },
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={product.image || `https://placehold.co/400x200?text=${encodeURIComponent(product.title)}`}
                                        alt={product.title}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box>
                                            <Typography variant="h6" gutterBottom>
                                                {product.title}
                                            </Typography>
                                            <Chip label={product.platform} size="small" color="primary" />
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {product.description}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                                            <Typography variant="h6" color="primary">
                                                {product.price} ₽
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => addToCart({ ...product, quantity: 1 })}
                                                disabled={!product.inStock}
                                            >
                                                {product.inStock ? 'В корзину' : 'Нет в наличии'}
                                            </Button>
                                        </Box>
                                        <Button
                                            component={Link}
                                            to={`/product/${product.id}`}
                                            size="small"
                                            fullWidth
                                        >
                                            Подробнее
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Button
                                variant="outlined"
                                size="large"
                                component={Link}
                                to="/catalog"
                                sx={{ px: 5 }}
                            >
                                Смотреть весь каталог
                            </Button>
                        </Box>
                    </Box>
                ) : null}

                {/* CTA Section */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: { xs: 3, md: 4 },
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: 'center',
                        gap: 3,
                        textAlign: { xs: 'center', md: 'left' },
                    }}
                >
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                            Получайте подборки игр и эксклюзивные скидки
                        </Typography>
                        <Typography color="text.secondary" variant="body1">
                            Зарегистрируйтесь и будьте в курсе всех новинок и специальных предложений
                        </Typography>
                    </Box>
                    <Button variant="contained" size="large" component={Link} to="/register" sx={{ px: 5 }}>
                        Создать аккаунт
                    </Button>
                </Paper>
            </Container>
        </Fade>
    );
};

export default HomePage;
