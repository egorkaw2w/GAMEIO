// src/pages/ResetPasswordPage.tsx
import {
    Alert,
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    LinearProgress,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { Lock, Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('Токен восстановления не найден');
                setVerifying(false);
                setTokenValid(false);
                return;
            }

            try {
                const response = await api.post('/password-reset/verify', { token });
                setTokenValid(true);
                setEmail(response.data.email);
            } catch (err: any) {
                console.error('Token verification failed:', err);
                if (err.response?.data?.expired) {
                    setError('Ссылка для восстановления пароля истекла. Запросите новую ссылку.');
                } else {
                    setError('Недействительная ссылка для восстановления пароля');
                }
                setTokenValid(false);
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
        if (password.length === 0) return { strength: 0, label: '', color: '' };
        if (password.length < 6) return { strength: 25, label: 'Слабый', color: 'error' };

        let strength = 25;
        if (password.length >= 8) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 12.5;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

        if (strength < 50) return { strength, label: 'Слабый', color: 'error' };
        if (strength < 75) return { strength, label: 'Средний', color: 'warning' };
        return { strength, label: 'Сильный', color: 'success' };
    };

    const passwordStrength = getPasswordStrength(newPassword);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (newPassword.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);

        try {
            await api.post('/password-reset/reset', {
                token,
                newPassword,
            });
            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            console.error('Error resetting password:', err);
            setError(err.response?.data?.error || 'Не удалось сбросить пароль');
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (verifying) {
        return (
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                        Проверка ссылки...
                    </Typography>
                    <LinearProgress sx={{ mt: 2 }} />
                </Paper>
            </Container>
        );
    }

    // Success state
    if (success) {
        return (
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                p: 2,
                                borderRadius: '50%',
                                bgcolor: 'success.lighter',
                                mb: 2,
                            }}
                        >
                            <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} />
                        </Box>
                        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                            Пароль изменен!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Ваш пароль был успешно изменен. Сейчас вы будете перенаправлены на страницу входа...
                        </Typography>
                        <LinearProgress sx={{ mt: 2 }} />
                    </Box>
                </Paper>
            </Container>
        );
    }

    // Invalid token state
    if (!tokenValid) {
        return (
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4 }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                    <Box sx={{ textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/forgot-password')}
                            sx={{ mr: 2 }}
                        >
                            Запросить новую ссылку
                        </Button>
                        <Button variant="outlined" onClick={() => navigate('/login')}>
                            Вернуться к входу
                        </Button>
                    </Box>
                </Paper>
            </Container>
        );
    }

    // Reset password form
    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            p: 2,
                            borderRadius: '50%',
                            bgcolor: 'primary.lighter',
                            mb: 2,
                        }}
                    >
                        <Lock sx={{ fontSize: 40, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                        Создайте новый пароль
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Для аккаунта: <strong>{email}</strong>
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Новый пароль"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={loading}
                        sx={{ mb: 1 }}
                        autoFocus
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {newPassword && (
                        <Box sx={{ mb: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={passwordStrength.strength}
                                color={passwordStrength.color as any}
                                sx={{ mb: 0.5, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color={`${passwordStrength.color}.main`}>
                                Надежность пароля: {passwordStrength.label}
                            </Typography>
                        </Box>
                    )}

                    <TextField
                        fullWidth
                        label="Подтвердите пароль"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        sx={{ mb: 3 }}
                        error={confirmPassword !== '' && newPassword !== confirmPassword}
                        helperText={
                            confirmPassword !== '' && newPassword !== confirmPassword
                                ? 'Пароли не совпадают'
                                : ''
                        }
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                        sx={{ mb: 2, py: 1.5 }}
                    >
                        {loading ? 'Изменение пароля...' : 'Изменить пароль'}
                    </Button>

                    <Box sx={{ textAlign: 'center' }}>
                        <Button variant="text" onClick={() => navigate('/login')}>
                            Вернуться к входу
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default ResetPasswordPage;
