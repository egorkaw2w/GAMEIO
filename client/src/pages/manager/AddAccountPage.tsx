// src/pages/manager/AddAccountPage.tsx
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
    TextField,
    Typography,
} from '@mui/material';
import { Add, AccountCircle } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackButton from '../../components/ui/BackButton';
import api from '../../lib/api';

interface Game {
    id: number;
    title: string;
}

const AddAccountPage = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [accountForm, setAccountForm] = useState({
        game_id: '',
        login: '',
        password: '',
        price: '',
    });

    useEffect(() => {
        if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
            navigate('/');
            return;
        }
        fetchGames();
    }, [user, navigate]);

    const fetchGames = async () => {
        try {
            const res = await api.get('/games');
            setGames(res.data);
        } catch (err: any) {
            console.error('Error fetching games:', err);
            setError(err.response?.data?.error || 'Не удалось загрузить игры');
        } finally {
            setLoading(false);
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

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <BackButton to="/admin" />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <AccountCircle sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Добавить аккаунт
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

            <Paper sx={{ borderRadius: 3, p: 4 }}>
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
            </Paper>
        </Container>
    );
};

export default AddAccountPage;
