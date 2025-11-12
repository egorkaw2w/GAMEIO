import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  registerSchema,
  type RegisterFormValues,
} from '../../lib/validation';
import { useAuth } from './hooks/useAuth';

type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register: registerUser, loading, error, clearError } = useAuth();
  const [values, setValues] = useState<RegisterFormValues>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange =
    (field: keyof RegisterFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (error) clearError();
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = registerSchema.safeParse(values);
    if (!validation.success) {
      const nextErrors: FieldErrors = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof RegisterFormValues;
        nextErrors[key] = issue.message;
      });
      setFieldErrors(nextErrors);
      return;
    }
    try {
      await registerUser(values);
      navigate('/');
    } catch {
      // already handled inside hook
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 480,
        mx: 'auto',
        p: 4,
        borderRadius: 3,
        boxShadow: 24,
        background: (theme) => theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Регистрация
        </Typography>
        <Typography color="text.secondary">
          Создайте аккаунт и начните покупки за минуты
        </Typography>
      </Box>
      {error && (
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      )}
      <TextField
        label="Имя пользователя"
        value={values.username}
        onChange={handleChange('username')}
        error={Boolean(fieldErrors.username)}
        helperText={fieldErrors.username}
        autoComplete="username"
        fullWidth
      />
      <TextField
        label="E-mail"
        type="email"
        value={values.email}
        onChange={handleChange('email')}
        error={Boolean(fieldErrors.email)}
        helperText={fieldErrors.email}
        autoComplete="email"
        fullWidth
      />
      <TextField
        label="Пароль"
        type="password"
        value={values.password}
        onChange={handleChange('password')}
        error={Boolean(fieldErrors.password)}
        helperText={fieldErrors.password}
        autoComplete="new-password"
        fullWidth
      />
      <TextField
        label="Повторите пароль"
        type="password"
        value={values.confirmPassword}
        onChange={handleChange('confirmPassword')}
        error={Boolean(fieldErrors.confirmPassword)}
        helperText={fieldErrors.confirmPassword}
        autoComplete="new-password"
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
      >
        {loading ? 'Создаём...' : 'Создать аккаунт'}
      </Button>
      <Typography textAlign="center" color="text.secondary">
        Уже зарегистрированы?{' '}
        <Link component={RouterLink} to="/login">
          Войдите
        </Link>
      </Typography>
    </Box>
  );
};

export default RegisterForm;

