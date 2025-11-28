// src/pages/admin/AdminDashboard.tsx
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Typography,
} from '@mui/material';
import {
    SportsEsports,
    VpnKey,
    AccountCircle,
    ManageAccounts,
    BarChart,
    Storage,
    History,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { useStore } from '../../store';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useStore();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'manager' && user.role !== 'admin') {
            navigate('/');
            return;
        }
    }, [user, navigate]);

    // Горячие клавиши для менеджера
    useHotkeys('alt+1', (e) => {
        e.preventDefault();
        if (user?.role === 'manager') {
            navigate('/manager/games');
        }
    }, { enableOnFormTags: false });

    useHotkeys('alt+2', (e) => {
        e.preventDefault();
        if (user?.role === 'manager') {
            navigate('/manager/add-key');
        }
    }, { enableOnFormTags: false });

    useHotkeys('alt+3', (e) => {
        e.preventDefault();
        if (user?.role === 'manager') {
            navigate('/manager/add-account');
        }
    }, { enableOnFormTags: false });

    // Горячие клавиши для админа
    useHotkeys('alt+1', (e) => {
        e.preventDefault();
        if (user?.role === 'admin') {
            navigate('/admin/managers');
        }
    }, { enableOnFormTags: false });

    useHotkeys('alt+2', (e) => {
        e.preventDefault();
        if (user?.role === 'admin') {
            navigate('/admin/statistics');
        }
    }, { enableOnFormTags: false });

    useHotkeys('alt+3', (e) => {
        e.preventDefault();
        if (user?.role === 'admin') {
            navigate('/admin/database');
        }
    }, { enableOnFormTags: false });

    useHotkeys('alt+4', (e) => {
        e.preventDefault();
        if (user?.role === 'admin') {
            navigate('/admin/logs');
        }
    }, { enableOnFormTags: false });

    if (!user) return null;

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
                    {user.role === 'admin' ? 'Админ-панель' : 'Панель менеджера'}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Добро пожаловать, {user.username}!
                </Typography>
            </Box>

            {user.role === 'manager' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                    <Card
                        sx={{
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: 6,
                            },
                        }}
                        onClick={() => navigate('/manager/games')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <SportsEsports sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                                Управление играми
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Добавление, редактирование и удаление игр
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{ mt: 3 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/manager/games');
                                }}
                            >
                                Перейти
                            </Button>
                        </CardContent>
                    </Card>

                    <Card
                        sx={{
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: 6,
                            },
                        }}
                        onClick={() => navigate('/manager/add-key')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <VpnKey sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                                Добавить ключ
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Добавление ключей активации для игр
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                sx={{ mt: 3 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/manager/add-key');
                                }}
                            >
                                Перейти
                            </Button>
                        </CardContent>
                    </Card>

                    <Card
                        sx={{
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: 6,
                            },
                        }}
                        onClick={() => navigate('/manager/add-account')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <AccountCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                                Добавить аккаунт
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Добавление игровых аккаунтов
                            </Typography>
                            <Button
                                variant="contained"
                                color="success"
                                sx={{ mt: 3 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/manager/add-account');
                                }}
                            >
                                Перейти
                            </Button>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {user.role === 'admin' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
                    <Card
                        sx={{
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: 6,
                            },
                        }}
                        onClick={() => navigate('/admin/managers')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <ManageAccounts sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                                Менеджеры
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Управление менеджерами системы
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{ mt: 3 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/admin/managers');
                                }}
                            >
                                Перейти
                            </Button>
                        </CardContent>
                    </Card>

                    <Card
                        sx={{
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: 6,
                            },
                        }}
                        onClick={() => navigate('/admin/statistics')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <BarChart sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                                Статистика
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Статистика продаж и аналитика
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                sx={{ mt: 3 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/admin/statistics');
                                }}
                            >
                                Перейти
                            </Button>
                        </CardContent>
                    </Card>

                    <Card
                        sx={{
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: 6,
                            },
                        }}
                        onClick={() => navigate('/admin/database')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Storage sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                                База данных
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Резервное копирование и восстановление
                            </Typography>
                            <Button
                                variant="contained"
                                color="error"
                                sx={{ mt: 3 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/admin/database');
                                }}
                            >
                                Перейти
                            </Button>
                        </CardContent>
                    </Card>

                    <Card
                        sx={{
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: 6,
                            },
                        }}
                        onClick={() => navigate('/admin/logs')}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <History sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                                Журнал событий
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Просмотр всех действий на сайте
                            </Typography>
                            <Button
                                variant="contained"
                                color="info"
                                sx={{ mt: 3 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/admin/logs');
                                }}
                            >
                                Перейти
                            </Button>
                        </CardContent>
                    </Card>
                </Box>
            )}
        </Container>
    );
};

export default AdminDashboard;
