// src/components/ui/LoadingSpinner.tsx
import { CircularProgress, Box } from '@mui/material';

const LoadingSpinner = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
    </Box>
);

export default LoadingSpinner;