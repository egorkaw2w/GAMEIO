// src/pages/manager/AddKeyPage.tsx
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
import { Add, VpnKey } from '@mui/icons-material';
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

const AddKeyPage = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [keyForm, setKeyForm] = useState({
        game_id: '',
        key_code: '',
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

    const formatKeyCode = (value: string) => {
        const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const limited = cleanValue.substring(0, 25);
        const formatted = limited.match(/.{1,5}/g)?.join('-') || limited;
        return formatted;
    };

    const handleKeyCodeChange = (value: string) => {
        const formatted = formatKeyCode(value);
        setKeyForm({ ...keyForm, key_code: formatted });
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

    if (loading) return <LoadingSpinner />;

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <BackButton to="/admin" />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <VpnKey sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Добавить ключ активации
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
                        onChange={(e) => handleKeyCodeChange(e.target.value)}
                        required
                        sx={{ mb: 3 }}
                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                        helperText="Автоматическое форматирование каждые 5 символов"
                        inputProps={{ maxLength: 29 }}
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
            </Paper>
        </Container>
    );
};

export default AddKeyPage;
