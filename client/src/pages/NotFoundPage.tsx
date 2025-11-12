import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NotFoundPage = () => (
  <Box sx={{ textAlign: 'center', py: 10 }}>
    <Typography variant="h2" gutterBottom>
      404
    </Typography>
    <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
      Такой страницы не существует или она была перемещена.
    </Typography>
    <Button variant="contained" component={RouterLink} to="/">
      На главную
    </Button>
  </Box>
);

export default NotFoundPage;

