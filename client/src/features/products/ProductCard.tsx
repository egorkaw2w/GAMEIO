// src/components/ui/ProductCard.tsx
import { Card, CardMedia, CardContent, Typography, Button, Box, Chip, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';

interface Props {
    product: Product;
}

const ProductCard = ({ product }: Props) => {
    return (
        <Card>
            <CardMedia
                component="img"
                height="140"
                image={product.image || 'https://placehold.co/400x240?text=GameIO'}
                alt={product.title}
            />
            <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                    {product.title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Chip size="small" color="primary" label={product.platform} />
                    <Typography variant="subtitle1" fontWeight={600}>
                        {product.price} ₽
                    </Typography>
                </Box>
                {product.availability && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Tooltip title="Доступно аккаунтов" arrow>
                            <Chip size="small" variant="outlined" label={`Акк: ${product.availability.accounts}`} />
                        </Tooltip>
                        <Tooltip title="Доступно ключей" arrow>
                            <Chip size="small" variant="outlined" label={`Ключи: ${product.availability.keys}`} />
                        </Tooltip>
                    </Box>
                )}
                <Box sx={{ mt: 2 }}>
                    <Button
                        size="small"
                        component={Link}
                        to={`/product/${product.id}`}
                        variant="contained"
                        fullWidth
                    >
                        Подробнее
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ProductCard;