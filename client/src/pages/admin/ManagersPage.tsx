// src/pages/admin/ManagersPage.tsx
import {
    Alert,
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Add, Delete, ManageAccounts } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackButton from '../../components/ui/BackButton';
import api from '../../lib/api';

interface Manager {
    id: number;
    username: string;
    email: string;
    created_at: string;
    roles: { id: number; name: string }[];
}

const ManagersPage = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [managers, setManagers] = useState<Manager[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [managerDialogOpen, setManagerDialogOpen] = useState(false);
    const [managerForm, setManagerForm] = useState({
        username: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchManagers();
    }, [user, navigate]);

    const fetchManagers = async () => {
        try {
            const res = await api.get('/users');
            const allUsers = res.data;
            const managerUsers = allUsers.filter((u: Manager) =>
                u.roles.some(r => r.name === 'manager')
            );
            setManagers(managerUsers);
        } catch (err: any) {
            console.error('Error fetching managers:', err);
            setError(err.response?.data?.error || 'Не удалось загрузить менеджеров');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenManagerDialog = () => {
        setManagerForm({ username: '', email: '', password: '' });
        setManagerDialogOpen(true);
    };

    const handleCloseManagerDialog = () => {
        setManagerDialogOpen(false);
        setManagerForm({ username: '', email: '', password: '' });
    };

    const handleCreateManager = async () => {
        setError(null);
        setSuccess(null);

        try {
            await api.post('/users/create-manager', managerForm);
            setSuccess('Менеджер успешно создан!');
            handleCloseManagerDialog();
            fetchManagers();
        } catch (err: any) {
            console.error('Error creating manager:', err);
            setError(err.response?.data?.error || 'Не удалось создать менеджера');
        }
    };

    const handleDeleteManager = async (managerId: number) => {
        if (!confirm('Вы уверены, что хотите удалить этого менеджера?')) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            await api.delete(`/users/${managerId}`);
            setSuccess('Менеджер успешно удалён!');
            fetchManagers();
        } catch (err: any) {
            console.error('Error deleting manager:', err);
            setError(err.response?.data?.error || 'Не удалось удалить менеджера');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
            <BackButton to="/admin" />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <ManageAccounts sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Управление менеджерами
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
                        Список менеджеров ({managers.length})
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenManagerDialog}
                    >
                        Создать менеджера
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Имя пользователя</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Дата создания</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {managers.map((manager) => (
                                <TableRow key={manager.id} hover>
                                    <TableCell>{manager.id}</TableCell>
                                    <TableCell>{manager.username}</TableCell>
                                    <TableCell>{manager.email}</TableCell>
                                    <TableCell>
                                        {new Date(manager.created_at).toLocaleDateString('ru-RU')}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteManager(manager.id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {managers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography color="text.secondary">
                                            Нет менеджеров
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={managerDialogOpen} onClose={handleCloseManagerDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Создать нового менеджера</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Имя пользователя"
                            value={managerForm.username}
                            onChange={(e) => setManagerForm({ ...managerForm, username: e.target.value })}
                            required
                            fullWidth
                        />

                        <TextField
                            label="Email"
                            type="email"
                            value={managerForm.email}
                            onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                            required
                            fullWidth
                        />

                        <TextField
                            label="Пароль"
                            type="password"
                            value={managerForm.password}
                            onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                            required
                            fullWidth
                            helperText="Минимум 6 символов"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseManagerDialog}>Отмена</Button>
                    <Button onClick={handleCreateManager} variant="contained">
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ManagersPage;
