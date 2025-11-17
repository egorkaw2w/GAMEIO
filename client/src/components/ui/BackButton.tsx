// src/components/ui/BackButton.tsx
import { Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
    to?: string;
}

const BackButton = ({ to }: BackButtonProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleClick}
            sx={{ mb: 3 }}
        >
            Назад
        </Button>
    );
};

export default BackButton;
