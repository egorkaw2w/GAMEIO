// src/pages/manager/ManagerInventoryPage.tsx
import {
    Alert,
    Box,
    Button,
    Container,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add,
    VpnKey,
    AccountCircle,
    Inventory,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';

interface Game {
    id: number;
    title: string;
    platform_id: number;
    price: number;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`inventory-tabpanel-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const ManagerInventoryPage = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [tabValue, setTabValue] = useState(0);
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Форма добавления ключа
    const [keyForm, setKeyForm] = useState({
        game_id: '',
        key_code: '',
        price: '',
    });

    // Форма добавления аккаунта
    const [accountForm, setAccountForm] = useState({
        game_id: '',
        login: '',
        password: '',
        price: '',
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'manager' && user.role !== 'admin') {
            navigate('/');
            return;
        }

        const fetchGames = async () => {
            try {
                const response = await api.get('/games');
                setGames(response.data);
            } catch (err: any) {
                console.error('Error fetching games:', err);
                setError(err.response?.data?.error || 'Не удалось загрузить список игр');
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, [user, navigate]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        setError(null);
        setSuccess(null);
    };

    const handleAddKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            await api.post('/inventory/keys', {
                game_id: parseInt(keyForm.game_id),
                key_code: keyForm.key_code,
                price: parseFloat(keyForm.price),
            });

            setSuccess('Ключ успешно добавлен!');
            setKeyForm({ game_id: '', key_code: '', price: '' });
        } catch (err: any) {
            console.error('Error adding key:', err);
            setError(err.response?.data?.error || 'Не удалось добавить ключ');
        }
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            await api.post('/inventory/accounts', {
                game_id: parseInt(accountForm.game_id),
                login: accountForm.login,
                password: accountForm.password,
                price: parseFloat(accountForm.price),
            });

            setSuccess('Аккаунт успешно добавлен!');
            setAccountForm({ game_id: '', login: '', password: '', price: '' });
        } catch (err: any) {
            console.error('Error adding account:', err);
            setError(err.response?.data?.error || 'Не удалось добавить аккаунт');
        }
    };

    if (loading) return <LoadingSpinner />;

    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Alert severity="error">
                    У вас нет доступа к этой странице
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Inventory sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Управление товарами
                </Typography>
            </Box>

            <Paper sx={{ borderRadius: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        icon={<VpnKey />}
                        iconPosition="start"
                        label="Добавить ключ"
                    />
                    <Tab
                        icon={<AccountCircle />}
                        iconPosition="start"
                        label="Добавить аккаунт"
                    />
                </Tabs>

                {error && (
                    <Alert severity="error" sx={{ m: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ m: 3 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                {/* Вкладка добавления ключа */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Добавить новый ключ активации
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Box component="form" onSubmit={handleAddKey}>
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Игра</InputLabel>
                                <Select
                                    value={keyForm.game_id}
                                    label="Игра"
                                    onChange={(e) => setKeyForm({ ...keyForm, game_id: e.target.value })}
                                    required
                                >
                                    {games.map((game) => (
                                        <MenuItem key={game.id} value={game.id}>
                                            {game.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Ключ активации"
                                value={keyForm.key_code}
                                onChange={(e) => setKeyForm({ ...keyForm, key_code: e.target.value })}
                                required
                                sx={{ mb: 3 }}
                                placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                            />

                            <TextField
                                fullWidth
                                label="Цена (₽)"
                                type="number"
                                value={keyForm.price}
                                onChange={(e) => setKeyForm({ ...keyForm, price: e.target.value })}
                                required
                                sx={{ mb: 3 }}
                                inputProps={{ min: 0, step: 0.01 }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                startIcon={<Add />}
                                fullWidth
                            >
                                Добавить ключ
                            </Button>
                        </Box>
                    </Box>
                </TabPanel>

                {/* Вкладка добавления аккаунта */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Добавить новый аккаунт
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Box component="form" onSubmit={handleAddAccount}>
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Игра</InputLabel>
                                <Select
                                    value={accountForm.game_id}
                                    label="Игра"
                                    onChange={(e) => setAccountForm({ ...accountForm, game_id: e.target.value })}
                                    required
                                >
                                    {games.map((game) => (
                                        <MenuItem key={game.id} value={game.id}>
                                            {game.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Логин"
                                value={accountForm.login}
                                onChange={(e) => setAccountForm({ ...accountForm, login: e.target.value })}
                                required
                                sx={{ mb: 3 }}
                                placeholder="user@example.com"
                            />

                            <TextField
                                fullWidth
                                label="Пароль"
                                type="text"
                                value={accountForm.password}
                                onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                                required
                                sx={{ mb: 3 }}
                            />

                            <TextField
                                fullWidth
                                label="Цена (₽)"
                                type="number"
                                value={accountForm.price}
                                onChange={(e) => setAccountForm({ ...accountForm, price: e.target.value })}
                                required
                                sx={{ mb: 3 }}
                                inputProps={{ min: 0, step: 0.01 }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                startIcon={<Add />}
                                fullWidth
                            >
                                Добавить аккаунт
                            </Button>
                        </Box>
                    </Box>
                </TabPanel>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, mt: 3, borderRadius: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Важно:</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    • Все добавленные товары автоматически получают статус "available"
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    • Пароли и ключи хранятся в зашифрованном виде
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    • Цена берётся из выбранной игры, но можно указать другую
                </Typography>
            </Paper>
        </Container>
    );
};

export default ManagerInventoryPage;
