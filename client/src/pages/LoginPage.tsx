import { Container, Fade } from '@mui/material';
import LoginForm from '../features/auth/LoginForm';

const LoginPage = () => (
  <Fade in timeout={400}>
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <LoginForm />
    </Container>
  </Fade>
);

export default LoginPage;

