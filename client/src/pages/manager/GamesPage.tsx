// src/pages/manager/GamesPage.tsx
import {
    Alert,
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit, SportsEsports } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackButton from '../../components/ui/BackButton';
import api from '../../lib/api';

interface Game {
    id: number;
    title: string;
    description: string;
    platform_id: number;
    platform_name?: string;
    available_accounts?: number;
    available_keys?: number;
}

interface Platform {
    id: number;
    name: string;
}

const GamesPage = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [games, setGames] = useState<Game[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [gameDialogOpen, setGameDialogOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | null>(null);
    const [gameForm, setGameForm] = useState({
        title: '',
        description: '',
        platform_id: '',
    });

    useEffect(() => {
        if (!user || user.role !== 'manager') {
            navigate('/');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [gamesRes, platformsRes] = await Promise.all([
                api.get('/games'),
                api.get('/platforms'),
            ]);
            setGames(gamesRes.data);
            setPlatforms(platformsRes.data);
        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError(err.response?.data?.error || 'Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenGameDialog = (game?: Game) => {
        if (game) {
            setEditingGame(game);
            setGameForm({
                title: game.title,
                description: game.description,
                platform_id: game.platform_id.toString(),
            });
        } else {
            setEditingGame(null);
            setGameForm({
                title: '',
                description: '',
                platform_id: '',
            });
        }
        setGameDialogOpen(true);
    };

    const handleCloseGameDialog = () => {
        setGameDialogOpen(false);
        setEditingGame(null);
        setGameForm({
            title: '',
            description: '',
            platform_id: '',
        });
    };

    const handleSaveGame = async () => {
        setError(null);
        setSuccess(null);

        try {
            const gameData = {
                title: gameForm.title,
                description: gameForm.description,
                platform_id: parseInt(gameForm.platform_id),
            };

            if (editingGame) {
                await api.put(`/games/${editingGame.id}`, gameData);
                setSuccess('Игра успешно обновлена!');
            } else {
                await api.post('/games', gameData);
                setSuccess('Игра успешно добавлена!');
            }

            handleCloseGameDialog();
            fetchData();
        } catch (err: any) {
            console.error('Error saving game:', err);
            setError(err.response?.data?.error || 'Не удалось сохранить игру');
        }
    };

    const handleDeleteGame = async (gameId: number) => {
        if (!confirm('Вы уверены, что хотите удалить эту игру? Все связанные товары также будут удалены.')) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            await api.delete(`/games/${gameId}`);
            setSuccess('Игра успешно удалена!');
            fetchData();
        } catch (err: any) {
            console.error('Error deleting game:', err);
            setError(err.response?.data?.error || 'Не удалось удалить игру');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
            <BackButton to="/admin" />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <SportsEsports sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Управление играми
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

            <Paper sx={{ borderRadius: 3, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                        Список игр ({games.length})
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenGameDialog()}
                    >
                        Добавить игру
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Название</TableCell>
                                <TableCell>Платформа</TableCell>
                                <TableCell align="center">Ключи</TableCell>
                                <TableCell align="center">Аккаунты</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {games.map((game) => (
                                <TableRow key={game.id} hover>
                                    <TableCell>{game.id}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {game.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {game.description.substring(0, 60)}...
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {platforms.find(p => p.id === game.platform_id)?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2" fontWeight={600} color="primary.main">
                                            {game.available_keys || 0}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="body2" fontWeight={600} color="secondary.main">
                                            {game.available_accounts || 0}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenGameDialog(game)}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteGame(game.id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={gameDialogOpen} onClose={handleCloseGameDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingGame ? 'Редактировать игру' : 'Добавить игру'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Название игры"
                            value={gameForm.title}
                            onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                            required
                            fullWidth
                        />

                        <TextField
                            label="Описание"
                            value={gameForm.description}
                            onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                            required
                            fullWidth
                            multiline
                            rows={3}
                        />

                        <FormControl fullWidth required>
                            <InputLabel>Платформа</InputLabel>
                            <Select
                                value={gameForm.platform_id}
                                label="Платформа"
                                onChange={(e) => setGameForm({ ...gameForm, platform_id: e.target.value })}
                            >
                                {platforms.map((platform) => (
                                    <MenuItem key={platform.id} value={platform.id}>
                                        {platform.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseGameDialog}>Отмена</Button>
                    <Button onClick={handleSaveGame} variant="contained">
                        {editingGame ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default GamesPage;
