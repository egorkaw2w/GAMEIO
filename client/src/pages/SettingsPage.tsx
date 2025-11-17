// src/pages/SettingsPage.tsx
import { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Paper,
    TextField,
    Typography,
    Divider,
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Save,
    Lock,
    Email,
    Person,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useStore } from '../store';
import api from '../lib/api';

const SettingsPage = () => {
    const { user, setUser } = useStore();

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Форма изменения имени пользователя
    const [username, setUsername] = useState(user?.username || '');
    const [usernameError, setUsernameError] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);

    // Форма изменения email
    const [email, setEmail] = useState(user?.email || '');
    const [emailError, setEmailError] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);

    // Форма изменения пароля
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <SettingsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Настройки доступны только авторизованным пользователям
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Войдите в систему, чтобы изменить настройки профиля
                    </Typography>
                    <Button variant="contained" size="large" component={RouterLink} to="/login">
                        Войти
                    </Button>
                </Paper>
            </Container>
        );
    }

    const handleUsernameChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setUsernameError('');
        setSuccessMessage('');
        setErrorMessage('');

        if (!username.trim() || username.length < 3) {
            setUsernameError('Имя пользователя должно содержать минимум 3 символа');
            return;
        }

        try {
            setUsernameLoading(true);
            const response = await api.patch('/users/me/username', { username: username.trim() });
            setSuccessMessage(response.data.message || 'Имя пользователя успешно изменено');

            // Обновляем пользователя в store
            if (response.data.user) {
                setUser({ ...user, ...response.data.user });
                // Обновляем localStorage
                localStorage.setItem('user', JSON.stringify({ ...user, ...response.data.user }));
            }
        } catch (err: any) {
            const message = err.response?.data?.error || 'Не удалось изменить имя пользователя';
            setErrorMessage(message);
            setUsernameError(message);
        } finally {
            setUsernameLoading(false);
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        setSuccessMessage('');
        setErrorMessage('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Введите корректный email');
            return;
        }

        try {
            setEmailLoading(true);
            const response = await api.patch('/users/me/email', { email: email.trim() });
            setSuccessMessage(response.data.message || 'Email успешно изменён');

            // Обновляем пользователя в store
            if (response.data.user) {
                setUser({ ...user, ...response.data.user });
                // Обновляем localStorage
                localStorage.setItem('user', JSON.stringify({ ...user, ...response.data.user }));
            }
        } catch (err: any) {
            const message = err.response?.data?.error || 'Не удалось изменить email';
            setErrorMessage(message);
            setEmailError(message);
        } finally {
            setEmailLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setSuccessMessage('');
        setErrorMessage('');

        if (!currentPassword) {
            setPasswordError('Введите текущий пароль');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Новый пароль должен содержать минимум 6 символов');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Пароли не совпадают');
            return;
        }

        try {
            setPasswordLoading(true);
            const response = await api.patch('/users/me/password', {
                currentPassword,
                newPassword,
            });
            setSuccessMessage(response.data.message || 'Пароль успешно изменён');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            const message = err.response?.data?.error || 'Не удалось изменить пароль';
            setErrorMessage(message);
            setPasswordError(message);
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <SettingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={700}>
                    Настройки
                </Typography>
            </Box>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}

            {errorMessage && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
                    {errorMessage}
                </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Изменение имени пользователя */}
                <Card elevation={3} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Person sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Typography variant="h5" fontWeight={600}>
                                Имя пользователя
                            </Typography>
                        </Box>
                        <Box component="form" onSubmit={handleUsernameChange}>
                            <TextField
                                fullWidth
                                label="Имя пользователя"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                error={Boolean(usernameError)}
                                helperText={usernameError}
                                sx={{ mb: 2 }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<Save />}
                                fullWidth
                                disabled={usernameLoading}
                            >
                                {usernameLoading ? 'Сохранение...' : 'Сохранить имя'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Изменение email */}
                <Card elevation={3} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Email sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Typography variant="h5" fontWeight={600}>
                                Email адрес
                            </Typography>
                        </Box>
                        <Box component="form" onSubmit={handleEmailChange}>
                            <TextField
                                fullWidth
                                type="email"
                                label="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={Boolean(emailError)}
                                helperText={emailError}
                                sx={{ mb: 2 }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<Save />}
                                fullWidth
                                disabled={emailLoading}
                            >
                                {emailLoading ? 'Сохранение...' : 'Сохранить email'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Изменение пароля */}
                <Card elevation={3} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Lock sx={{ fontSize: 32, color: 'error.main' }} />
                            <Typography variant="h5" fontWeight={600}>
                                Изменение пароля
                            </Typography>
                        </Box>
                        <Box component="form" onSubmit={handlePasswordChange}>
                            <TextField
                                fullWidth
                                type="password"
                                label="Текущий пароль"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <Divider sx={{ my: 2 }} />
                            <TextField
                                fullWidth
                                type="password"
                                label="Новый пароль"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                type="password"
                                label="Подтвердите новый пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            {passwordError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {passwordError}
                                </Alert>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                color="error"
                                startIcon={<Save />}
                                fullWidth
                                disabled={passwordLoading}
                            >
                                {passwordLoading ? 'Изменение...' : 'Изменить пароль'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Дополнительная информация */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Примечание:</strong> После изменения email или пароля вам может потребоваться
                        повторно войти в систему. Убедитесь, что вы запомнили новые данные для входа.
                    </Typography>
                </Paper>

                {/* Кнопка возврата к профилю */}
                <Button
                    variant="outlined"
                    size="large"
                    component={RouterLink}
                    to="/profile"
                >
                    Вернуться к профилю
                </Button>
            </Box>
        </Container>
    );
};

export default SettingsPage;
