// src/pages/admin/DatabasePage.tsx
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Storage, CloudDownload, RestorePage, DeleteSweep, Backup } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackButton from '../../components/ui/BackButton';
import api from '../../lib/api';

interface BackupFile {
    filename: string;
    size: number;
    created_at: string;
}

const DatabasePage = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [backups, setBackups] = useState<BackupFile[]>([]);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchBackups();
    }, [user, navigate]);

    const fetchBackups = async () => {
        try {
            const res = await api.get('/backup/list');
            setBackups(res.data.backups || []);
        } catch (err: any) {
            console.error('Error fetching backups:', err);
            setError(err.response?.data?.error || 'Не удалось загрузить список бэкапов');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setError(null);
        setSuccess(null);

        try {
            await api.post('/backup/create');
            setSuccess('Резервная копия успешно создана!');
            fetchBackups();
        } catch (err: any) {
            console.error('Error creating backup:', err);
            setError(err.response?.data?.error || 'Не удалось создать резервную копию');
        }
    };

    const handleRestoreBackup = async () => {
        if (!backups.length) {
            setError('Нет доступных резервных копий');
            return;
        }

        if (!confirm('Вы уверены, что хотите восстановить базу данных из последней резервной копии? Текущие данные будут перезаписаны.')) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            const latestBackup = backups[0];
            await api.post('/backup/restore', { filename: latestBackup.filename });
            setSuccess('База данных успешно восстановлена!');
        } catch (err: any) {
            console.error('Error restoring backup:', err);
            setError(err.response?.data?.error || 'Не удалось восстановить базу данных');
        }
    };

    const handleResetDatabase = async () => {
        if (!confirm('⚠️ ВНИМАНИЕ! Вы уверены, что хотите сбросить базу данных? ВСЕ ДАННЫЕ БУДУТ УДАЛЕНЫ БЕЗВОЗВРАТНО!')) {
            return;
        }

        if (!confirm('Это действие нельзя отменить. Продолжить?')) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            await api.post('/backup/reset');
            setSuccess('База данных успешно сброшена!');
        } catch (err: any) {
            console.error('Error resetting database:', err);
            setError(err.response?.data?.error || 'Не удалось сбросить базу данных');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
            <BackButton to="/admin" />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Storage sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Операции с базой данных
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

            <Stack spacing={3}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Backup color="primary" />
                                <Typography variant="h6">Резервное копирование</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Создайте резервную копию базы данных для сохранения текущего состояния
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<CloudDownload />}
                                onClick={handleCreateBackup}
                                fullWidth
                            >
                                Создать резервную копию
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <RestorePage color="success" />
                                <Typography variant="h6">Восстановление</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Восстановите базу данных из последней резервной копии
                            </Typography>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<RestorePage />}
                                onClick={handleRestoreBackup}
                                fullWidth
                                disabled={!backups.length}
                            >
                                Восстановить из бэкапа
                            </Button>
                        </CardContent>
                    </Card>
                </Box>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <DeleteSweep color="error" />
                            <Typography variant="h6">Сброс базы данных</Typography>
                        </Box>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            ⚠️ ВНИМАНИЕ: Это действие удалит все данные из базы безвозвратно!
                        </Alert>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Удалить все данные из базы данных, сохранив только структуру таблиц
                        </Typography>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteSweep />}
                            onClick={handleResetDatabase}
                            fullWidth
                        >
                            Сбросить базу данных
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Список резервных копий ({backups.length})
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Имя файла</TableCell>
                                        <TableCell>Размер</TableCell>
                                        <TableCell>Дата создания</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {backups.map((backup) => (
                                        <TableRow key={backup.filename}>
                                            <TableCell>{backup.filename}</TableCell>
                                            <TableCell>
                                                {(backup.size / 1024).toFixed(2)} KB
                                            </TableCell>
                                            <TableCell>
                                                {new Date(backup.created_at).toLocaleString('ru-RU')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {backups.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">
                                                <Typography color="text.secondary">
                                                    Нет резервных копий
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
};

export default DatabasePage;
