// src/pages/CatalogPage.tsx
import { Alert, Box, Typography } from '@mui/material';
import ProductCard from '../features/products/ProductCard';
import { useProducts } from '../features/products/hooks/useProducts';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useStore } from '../store';

const CatalogPage = () => {
    const { products, loading, error } = useProducts();
    const { addToCart } = useStore();

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <Typography variant="h4" gutterBottom>Каталог</Typography>
            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            {products.length === 0 ? (
                <Typography color="text.secondary">Товары скоро появятся.</Typography>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: {
                            xs: 'repeat(1, minmax(0, 1fr))',
                            sm: 'repeat(2, minmax(0, 1fr))',
                            md: 'repeat(3, minmax(0, 1fr))',
                        },
                    }}
                >
                    {products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={() => addToCart({ ...product, quantity: 1 })}
                        />
                    ))}
                </Box>
            )}
        </>
    );
};

export default CatalogPage;