// src/pages/ForgotPasswordPage.tsx
import {
    Alert,
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    Link as MuiLink,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await api.post('/password-reset/request', { email });
            setSuccess(true);
            setEmail('');
        } catch (err: any) {
            console.error('Error requesting password reset:', err);
            setError(err.response?.data?.error || 'Не удалось отправить запрос');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Box sx={{ mb: 3 }}>
                <Button
                    component={Link}
                    to="/login"
                    startIcon={<ArrowBack />}
                    variant="text"
                >
                    Назад к входу
                </Button>
            </Box>

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
                        <Email sx={{ fontSize: 40, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                        Забыли пароль?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Введите ваш email, и мы отправим вам инструкции по восстановлению пароля
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                            Письмо отправлено!
                        </Typography>
                        <Typography variant="body2">
                            Если этот email зарегистрирован в системе, мы отправили инструкции по
                            восстановлению пароля. Проверьте свою почту (включая папку "Спам").
                        </Typography>
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading || success}
                        sx={{ mb: 3 }}
                        placeholder="example@email.com"
                        autoFocus
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading || success}
                        sx={{ mb: 2, py: 1.5 }}
                    >
                        {loading ? 'Отправка...' : 'Отправить инструкции'}
                    </Button>

                    {success && (
                        <Button
                            fullWidth
                            variant="text"
                            size="small"
                            onClick={() => {
                                setSuccess(false);
                                setEmail('');
                            }}
                        >
                            Отправить еще раз
                        </Button>
                    )}
                </Box>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Вспомнили пароль?{' '}
                        <MuiLink component={Link} to="/login" fontWeight={600}>
                            Войти
                        </MuiLink>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default ForgotPasswordPage;
