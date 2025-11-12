// src/components/layout/Footer.tsx
import {
    Box,
    Container,
    Divider,
    IconButton,
    Link,
    Paper,
    Typography,
} from '@mui/material';
import {
    Email,
    Phone,
    LocationOn,
    Facebook,
    Twitter,
    Instagram,
    YouTube,
    SportsEsports,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <Paper
            component="footer"
            elevation={8}
            square
            sx={{
                mt: 'auto',
                backgroundColor: 'primary.dark',
                color: 'white',
                pt: 6,
                pb: 3,
            }}
        >
            <Container maxWidth="xl">
                {/* Main footer content */}
                <Box
                    sx={{
                        display: 'grid',
                        gap: 4,
                        gridTemplateColumns: {
                            xs: 'repeat(1, minmax(0, 1fr))',
                            sm: 'repeat(2, minmax(0, 1fr))',
                            md: 'repeat(4, minmax(0, 1fr))',
                        },
                        mb: 4,
                    }}
                >
                    {/* About section */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <SportsEsports sx={{ fontSize: 32 }} />
                            <Typography variant="h5" fontWeight={700}>
                                GameIO
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7, opacity: 0.9 }}>
                            Крупнейший маркетплейс цифровых ключей и аккаунтов для Steam,
                            PlayStation, Xbox, Nintendo и других платформ.
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Мгновенная доставка, гарантия качества, поддержка 24/7.
                        </Typography>
                    </Box>

                    {/* Navigation section */}
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Навигация
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Link
                                component={RouterLink}
                                to="/"
                                color="inherit"
                                underline="hover"
                                sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                            >
                                Главная
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/catalog"
                                color="inherit"
                                underline="hover"
                                sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                            >
                                Каталог
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/orders"
                                color="inherit"
                                underline="hover"
                                sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                            >
                                Мои заказы
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/profile"
                                color="inherit"
                                underline="hover"
                                sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                            >
                                Профиль
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/cart"
                                color="inherit"
                                underline="hover"
                                sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                            >
                                Корзина
                            </Link>
                        </Box>
                    </Box>

                    {/* Help section */}
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Помощь
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Link
                                href="#"
                                color="inherit"
                                underline="hover"
                                sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                            >
                                Как купить
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                underline="hover"
                                sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                            >
                                Способы оплаты
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                underline="hover"
                                sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                            >
                                Гарантии и возврат
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                underline="hover"
                                sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                            >
                                Частые вопросы
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                underline="hover"
                                sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                            >
                                Пользовательское соглашение
                            </Link>
                        </Box>
                    </Box>

                    {/* Contact section */}
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Контакты
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Email sx={{ fontSize: 20, opacity: 0.7 }} />
                                <Link
                                    href="mailto:support@gameio.dev"
                                    color="inherit"
                                    underline="hover"
                                    sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}
                                >
                                    support@gameio.dev
                                </Link>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Phone sx={{ fontSize: 20, opacity: 0.7 }} />
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    +7 (999) 123-45-67
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn sx={{ fontSize: 20, opacity: 0.7 }} />
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Россия, Москва
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ opacity: 0.7, mt: 1 }}>
                                Поддержка: Пн–Вс, 10:00–22:00
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.2)' }} />

                {/* Bottom section */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        © {currentYear} GameIO. Все права защищены. Маркетплейс цифровых товаров.
                    </Typography>

                    {/* Social media icons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                            href="https://facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            <Facebook />
                        </IconButton>
                        <IconButton
                            href="https://twitter.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            <Twitter />
                        </IconButton>
                        <IconButton
                            href="https://instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            <Instagram />
                        </IconButton>
                        <IconButton
                            href="https://youtube.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            <YouTube />
                        </IconButton>
                    </Box>
                </Box>

                {/* Additional info */}
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        GameIO не является официальным дистрибьютором игр. Все товарные знаки являются
                        собственностью соответствующих владельцев.
                    </Typography>
                </Box>
            </Container>
        </Paper>
    );
};

export default Footer;
