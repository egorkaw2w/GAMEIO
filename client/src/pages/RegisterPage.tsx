import { Container, Fade } from '@mui/material';
import RegisterForm from '../features/auth/RegisterForm';

const RegisterPage = () => (
  <Fade in timeout={400}>
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <RegisterForm />
    </Container>
  </Fade>
);

export default RegisterPage;

