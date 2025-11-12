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
import { loginSchema, type LoginFormValues } from '../../lib/validation';
import { useAuth } from './hooks/useAuth';

type FieldErrors = Partial<Record<keyof LoginFormValues, string>>;

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange =
    (field: keyof LoginFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (error) clearError();
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = loginSchema.safeParse(values);
    if (!validation.success) {
      const nextErrors: FieldErrors = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof LoginFormValues;
        nextErrors[key] = issue.message;
      });
      setFieldErrors(nextErrors);
      return;
    }
    try {
      await login(values);
      navigate('/');
    } catch {
      // error already handled in hook
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 420,
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
          Войти
        </Typography>
        <Typography color="text.secondary">
          Добро пожаловать в GameIO
        </Typography>
      </Box>
      {error && (
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      )}
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
        autoComplete="current-password"
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
      >
        {loading ? 'Входим...' : 'Войти'}
      </Button>
      <Typography textAlign="center" color="text.secondary">
        Нет аккаунта?{' '}
        <Link component={RouterLink} to="/register">
          Зарегистрируйтесь
        </Link>
      </Typography>
    </Box>
  );
};

export default LoginForm;

