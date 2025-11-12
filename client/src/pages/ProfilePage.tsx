// src/pages/ProfilePage.tsx
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Paper,
    Typography,
} from '@mui/material';
import {
    Person,
    Email,
    ShoppingBag,
    Settings,
    Logout,
    AdminPanelSettings,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useState } from 'react';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, logout } = useStore();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Профиль доступен только авторизованным пользователям
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Войдите в систему, чтобы увидеть свой профиль
                    </Typography>
                    <Button variant="contained" size="large" component={RouterLink} to="/login">
                        Войти
                    </Button>
                </Paper>
            </Container>
        );
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'error';
            case 'manager':
                return 'warning';
            default:
                return 'primary';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Администратор';
            case 'manager':
                return 'Менеджер';
            default:
                return 'Пользователь';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Person sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Профиль
                </Typography>
            </Box>

            {showLogoutConfirm && (
                <Alert
                    severity="warning"
                    sx={{ mb: 3 }}
                    onClose={() => setShowLogoutConfirm(false)}
                    action={
                        <Button color="inherit" size="small" onClick={handleLogout}>
                            Выйти
                        </Button>
                    }
                >
                    Вы уверены, что хотите выйти из системы?
                </Alert>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: {
                        xs: 'repeat(1, minmax(0, 1fr))',
                        md: '1fr 2fr',
                    },
                }}
            >
                {/* Левая колонка - информация о пользователе */}
                <Box>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                        <Avatar
                            sx={{
                                width: 120,
                                height: 120,
                                mx: 'auto',
                                mb: 3,
                                fontSize: 48,
                                bgcolor: 'primary.main',
                            }}
                        >
                            {user.username[0].toUpperCase()}
                        </Avatar>

                        <Typography variant="h5" gutterBottom fontWeight={600}>
                            {user.username}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 2 }}>
                            <Email sx={{ fontSize: 20, color: 'text.secondary' }} />
                            <Typography color="text.secondary">{user.email}</Typography>
                        </Box>

                        <Chip
                            icon={user.role === 'admin' || user.role === 'manager' ? <AdminPanelSettings /> : undefined}
                            label={getRoleLabel(user.role)}
                            color={getRoleColor(user.role)}
                            sx={{ mb: 3 }}
                        />

                        <Divider sx={{ my: 3 }} />

                        <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            startIcon={<Logout />}
                            onClick={() => setShowLogoutConfirm(true)}
                        >
                            Выйти из аккаунта
                        </Button>
                    </Paper>
                </Box>

                {/* Правая колонка - быстрые действия */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography variant="h5" fontWeight={600}>
                        Быстрые действия
                    </Typography>

                    {/* Карточка заказов */}
                    <Card
                        sx={{
                            borderRadius: 3,
                            transition: 'transform 220ms ease, box-shadow 220ms ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 8,
                            },
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <ShoppingBag sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        История заказов
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Просмотрите все ваши покупки и ключи
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                variant="contained"
                                fullWidth
                                component={RouterLink}
                                to="/orders"
                                endIcon={<ShoppingBag />}
                            >
                                Перейти к заказам
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Карточка настроек */}
                    <Card
                        sx={{
                            borderRadius: 3,
                            transition: 'transform 220ms ease, box-shadow 220ms ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 8,
                            },
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Settings sx={{ fontSize: 40, color: 'secondary.main' }} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        Настройки профиля
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Измените пароль, email и другие параметры
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                variant="outlined"
                                fullWidth
                                component={RouterLink}
                                to="/settings"
                                endIcon={<Settings />}
                            >
                                Открыть настройки
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Информационная карточка */}
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            О вашем аккаунте
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Имя пользователя:</Typography>
                                <Typography fontWeight={600}>{user.username}</Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Email:</Typography>
                                <Typography fontWeight={600}>{user.email}</Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Роль:</Typography>
                                <Typography fontWeight={600}>{getRoleLabel(user.role)}</Typography>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">ID пользователя:</Typography>
                                <Typography fontWeight={600}>#{user.id}</Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Дополнительные действия */}
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: {
                                xs: 'repeat(1, minmax(0, 1fr))',
                                sm: 'repeat(2, minmax(0, 1fr))',
                            },
                        }}
                    >
                        <Button
                            variant="outlined"
                            size="large"
                            component={RouterLink}
                            to="/catalog"
                        >
                            Перейти в каталог
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            component={RouterLink}
                            to="/cart"
                        >
                            Открыть корзину
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default ProfilePage;
