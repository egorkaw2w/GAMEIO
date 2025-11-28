// src/pages/admin/LogsPage.tsx
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    History,
    Search,
    FilterList,
    Clear,
    Refresh,
    DeleteSweep,
    ExpandMore,
    ExpandLess,
    Event,
} from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BackButton from '../../components/ui/BackButton';
import api from '../../lib/api';

interface LogEntry {
    id: number;
    user_id: number | null;
    username: string | null;
    email: string | null;
    user_role: string;
    action: string;
    table_name: string;
    old_value: string | null;
    new_value: string | null;
    timestamp: string;
}

interface LogStats {
    total: number;
    last24h: number;
    last7d: number;
    topActions: { action: string; count: string }[];
    activityByDay: { date: string; count: string }[];
}

interface LogUser {
    id: number;
    username: string;
    email: string;
}

const LogsPage = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Данные
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<LogStats | null>(null);
    const [actions, setActions] = useState<string[]>([]);
    const [tables, setTables] = useState<string[]>([]);
    const [users, setUsers] = useState<LogUser[]>([]);

    // Пагинация
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;

    // Фильтры
    const [filters, setFilters] = useState({
        action: '',
        table_name: '',
        user_id: '',
        date_from: '',
        date_to: '',
        search: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    // Раскрытые строки для просмотра значений
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchInitialData();
    }, [user, navigate]);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchLogs();
        }
    }, [page, filters]);

    const fetchInitialData = async () => {
        try {
            const [statsRes, actionsRes, tablesRes, usersRes] = await Promise.all([
                api.get('/logs/stats'),
                api.get('/logs/actions'),
                api.get('/logs/tables'),
                api.get('/logs/users'),
            ]);

            setStats(statsRes.data);
            setActions(actionsRes.data.actions || []);
            setTables(tablesRes.data.tables || []);
            setUsers(usersRes.data.users || []);
        } catch (err: any) {
            console.error('Error fetching initial data:', err);
        }
    };

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', limit.toString());

            if (filters.action) params.set('action', filters.action);
            if (filters.table_name) params.set('table_name', filters.table_name);
            if (filters.user_id) params.set('user_id', filters.user_id);
            if (filters.date_from) params.set('date_from', filters.date_from);
            if (filters.date_to) params.set('date_to', filters.date_to);
            if (filters.search) params.set('search', filters.search);

            const res = await api.get(`/logs?${params.toString()}`);
            setLogs(res.data.logs || []);
            setTotalPages(res.data.pagination.totalPages);
            setTotal(res.data.pagination.total);
        } catch (err: any) {
            console.error('Error fetching logs:', err);
            setError(err.response?.data?.error || 'Не удалось загрузить логи');
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    const handleClearFilters = () => {
        setFilters({
            action: '',
            table_name: '',
            user_id: '',
            date_from: '',
            date_to: '',
            search: '',
        });
        setPage(1);
    };

    const handleClearOldLogs = async () => {
        if (!confirm('Удалить логи старше 30 дней? Это действие необратимо.')) {
            return;
        }

        try {
            const res = await api.delete('/logs/clear?days=30');
            setSuccess(res.data.message);
            fetchLogs();
            fetchInitialData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Не удалось очистить логи');
        }
    };

    const toggleRowExpanded = (id: number) => {
        setExpandedRows((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const getActionColor = (action: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes('delete') || lowerAction.includes('remove')) return 'error';
        if (lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('insert')) return 'success';
        if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'warning';
        if (lowerAction.includes('login') || lowerAction.includes('auth')) return 'info';
        if (lowerAction.includes('order') || lowerAction.includes('purchase')) return 'secondary';
        return 'default';
    };

    const formatJson = (value: string | null): string => {
        if (!value) return '-';
        try {
            const parsed = JSON.parse(value);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return value;
        }
    };

    // Функция для генерации человекочитаемого описания лога
    const getHumanReadableDescription = (log: LogEntry): string => {
        const roleNames: Record<string, string> = {
            admin: 'Администратор',
            manager: 'Менеджер',
            user: 'Пользователь',
        };

        type LogData = Record<string, unknown> | null;
        type ActionFn = (data: LogData, oldData: LogData) => string;

        const actionDescriptions: Record<string, ActionFn> = {
            // Пользователи
            USER_REGISTER: (data) => `зарегистрировался (${(data?.username as string) || 'N/A'})`,
            USER_LOGIN: () => `вошёл в систему`,

            // Игры
            GAME_CREATE: (data) => `добавил игру "${(data?.title as string) || 'N/A'}" (${(data?.platform as string) || 'N/A'})`,
            GAME_UPDATE: (data, oldData) => `обновил игру "${(data?.title as string) || (oldData?.title as string) || 'N/A'}"`,
            GAME_DELETE: (_data, oldData) => `удалил игру "${(oldData?.title as string) || 'N/A'}"`,

            // Ключи
            KEY_ADD: (data) => `добавил ключ ${(data?.key_code as string) || 'N/A'} для игры "${(data?.game_title as string) || 'N/A'}" (${data?.price || 0}₽)`,
            KEY_UPDATE: (data) => `обновил ключ для игры "${(data?.game_title as string) || 'N/A'}"`,
            KEY_DELETE: (_data, oldData) => `удалил ключ для игры "${(oldData?.game_title as string) || 'N/A'}"`,

            // Аккаунты
            ACCOUNT_ADD: (data) => `добавил аккаунт "${(data?.login as string) || 'N/A'}" для игры "${(data?.game_title as string) || 'N/A'}" (${data?.price || 0}₽)`,
            ACCOUNT_UPDATE: (data) => `обновил аккаунт "${(data?.login as string) || 'N/A'}" для игры "${(data?.game_title as string) || 'N/A'}"`,
            ACCOUNT_DELETE: (_data, oldData) => `удалил аккаунт "${(oldData?.login as string) || 'N/A'}" для игры "${(oldData?.game_title as string) || 'N/A'}"`,

            // Заказы
            ORDER_CREATE: (data) => `создал заказ #${data?.order_id || 'N/A'} на сумму ${data?.total_price || 0}₽`,
            ORDER_CANCEL: (data) => `отменил заказ #${data?.order_id || 'N/A'}`,
        };

        const roleName = roleNames[log.user_role] || 'Пользователь';
        const username = log.username || 'Система';

        let newData: LogData = null;
        let oldData: LogData = null;

        try {
            if (log.new_value) newData = JSON.parse(log.new_value) as LogData;
        } catch {
            // ignore parse errors
        }

        try {
            if (log.old_value) oldData = JSON.parse(log.old_value) as LogData;
        } catch {
            // ignore parse errors
        }

        const actionFn = actionDescriptions[log.action];
        if (actionFn) {
            const actionText = actionFn(newData, oldData);
            return `${roleName} ${username} ${actionText}`;
        }

        // Если действие неизвестно, возвращаем базовое описание
        return `${roleName} ${username} выполнил действие ${log.action}`;
    };

    // Форматирование даты в коротком формате
    const formatShortDate = (timestamp: string): string => {
        const date = new Date(timestamp);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).replace(',', ' -');
    };

    if (loading && logs.length === 0) return <LoadingSpinner />;

    return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
            <BackButton to="/admin" />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <History sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Журнал событий
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

            {/* Статистика */}
            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Всего записей
                                </Typography>
                                <Typography variant="h4" fontWeight={700}>
                                    {stats.total.toLocaleString('ru-RU')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    За 24 часа
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="primary">
                                    {stats.last24h.toLocaleString('ru-RU')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    За 7 дней
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="secondary">
                                    {stats.last7d.toLocaleString('ru-RU')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Найдено
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="info.main">
                                    {total.toLocaleString('ru-RU')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Панель управления */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                    <TextField
                        size="small"
                        placeholder="Поиск..."
                        value={filters.search}
                        onChange={(e) => {
                            setFilters({ ...filters, search: e.target.value });
                            setPage(1);
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: 250 }}
                    />

                    <Button
                        variant={showFilters ? 'contained' : 'outlined'}
                        startIcon={<FilterList />}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        Фильтры
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => {
                            fetchLogs();
                            fetchInitialData();
                        }}
                    >
                        Обновить
                    </Button>

                    <Box sx={{ flexGrow: 1 }} />

                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteSweep />}
                        onClick={handleClearOldLogs}
                    >
                        Очистить старые
                    </Button>
                </Stack>

                {/* Фильтры */}
                {showFilters && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Действие</InputLabel>
                                    <Select
                                        value={filters.action}
                                        label="Действие"
                                        onChange={(e) => {
                                            setFilters({ ...filters, action: e.target.value });
                                            setPage(1);
                                        }}
                                    >
                                        <MenuItem value="">Все</MenuItem>
                                        {actions.map((action) => (
                                            <MenuItem key={action} value={action}>
                                                {action}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Таблица</InputLabel>
                                    <Select
                                        value={filters.table_name}
                                        label="Таблица"
                                        onChange={(e) => {
                                            setFilters({ ...filters, table_name: e.target.value });
                                            setPage(1);
                                        }}
                                    >
                                        <MenuItem value="">Все</MenuItem>
                                        {tables.map((table) => (
                                            <MenuItem key={table} value={table}>
                                                {table}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Пользователь</InputLabel>
                                    <Select
                                        value={filters.user_id}
                                        label="Пользователь"
                                        onChange={(e) => {
                                            setFilters({ ...filters, user_id: e.target.value });
                                            setPage(1);
                                        }}
                                    >
                                        <MenuItem value="">Все</MenuItem>
                                        {users.map((u) => (
                                            <MenuItem key={u.id} value={u.id.toString()}>
                                                {u.username}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label="Дата от"
                                    value={filters.date_from}
                                    onChange={(e) => {
                                        setFilters({ ...filters, date_from: e.target.value });
                                        setPage(1);
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label="Дата до"
                                    value={filters.date_to}
                                    onChange={(e) => {
                                        setFilters({ ...filters, date_to: e.target.value });
                                        setPage(1);
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<Clear />}
                                    onClick={handleClearFilters}
                                >
                                    Сбросить
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Paper>

            {/* Таблица логов */}
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell width={40}></TableCell>
                            <TableCell width={150}>Время</TableCell>
                            <TableCell>Описание</TableCell>
                            <TableCell width={120}>Действие</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.map((log) => (
                            <>
                                <TableRow
                                    key={log.id}
                                    hover
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => toggleRowExpanded(log.id)}
                                >
                                    <TableCell>
                                        <IconButton size="small">
                                            {expandedRows.has(log.id) ? <ExpandLess /> : <ExpandMore />}
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={new Date(log.timestamp).toLocaleString('ru-RU')}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Event fontSize="small" color="action" />
                                                <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                                    {formatShortDate(log.timestamp)}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {getHumanReadableDescription(log)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.action}
                                            size="small"
                                            color={getActionColor(log.action)}
                                        />
                                    </TableCell>
                                </TableRow>

                                {/* Раскрытая строка с деталями */}
                                {expandedRows.has(log.id) && (
                                    <TableRow key={`${log.id}-expanded`}>
                                        <TableCell colSpan={4} sx={{ bgcolor: 'grey.50' }}>
                                            <Grid container spacing={2} sx={{ p: 2 }}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Typography variant="subtitle2" color="error" gutterBottom>
                                                        Старое значение:
                                                    </Typography>
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 1,
                                                            maxHeight: 200,
                                                            overflow: 'auto',
                                                            bgcolor: 'background.paper',
                                                        }}
                                                    >
                                                        <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                                                            {formatJson(log.old_value)}
                                                        </pre>
                                                    </Paper>
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                                                        Новое значение:
                                                    </Typography>
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 1,
                                                            maxHeight: 200,
                                                            overflow: 'auto',
                                                            bgcolor: 'background.paper',
                                                        }}
                                                    >
                                                        <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                                                            {formatJson(log.new_value)}
                                                        </pre>
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        ))}

                        {logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        Логи не найдены
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Пагинация */}
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Container>
    );
};

export default LogsPage;
