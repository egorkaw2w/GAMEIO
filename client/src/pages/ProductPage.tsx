import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Fade,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useProduct } from '../features/products/hooks/useProduct';
import { useStore } from '../store';

const ProductPage = () => {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const { addToCart } = useStore();
  const { product, loading, error } = useProduct(
    Number.isFinite(productId) ? productId : null,
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h5" gutterBottom>
          {error ?? 'Товар не найден'}
        </Typography>
        <Button variant="contained" component={RouterLink} to="/catalog">
          Вернуться в каталог
        </Button>
      </Box>
    );
  }

  const availabilityCount =
    (product.availability?.accounts ?? 0) +
    (product.availability?.keys ?? 0);
  const isOutOfStock = product.inStock === false || availabilityCount === 0;

  return (
    <Fade in timeout={400}>
      <Box>
        <Breadcrumbs sx={{ mb: 3 }} aria-label="breadcrumb">
          <Button color="inherit" component={RouterLink} to="/">
            Главная
          </Button>
          <Button color="inherit" component={RouterLink} to="/catalog">
            Каталог
          </Button>
          <Typography color="text.primary">{product.title}</Typography>
        </Breadcrumbs>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gap: 4,
            gridTemplateColumns: {
              xs: 'repeat(1, minmax(0, 1fr))',
              md: 'repeat(2, minmax(0, 1fr))',
            },
          }}
        >
          <Box>
            <Box
              component="img"
              src={product.image || 'https://placehold.co/800x520?text=GameIO'}
              alt={product.title}
              sx={{
                width: '100%',
                borderRadius: 3,
                boxShadow: 12,
                objectFit: 'cover',
                transition: 'transform 320ms ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            />
          </Box>
          <Box>
            <Typography variant="h3" gutterBottom>
              {product.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Chip label={product.platform} color="primary" />
              <Typography variant="h5">{product.price} ₽</Typography>
            </Box>
            {product.availability && (
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Chip
                  variant="outlined"
                  label={`Аккаунты: ${product.availability.accounts}`}
                />
                <Chip
                  variant="outlined"
                  label={`Ключи: ${product.availability.keys}`}
                />
              </Box>
            )}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, lineHeight: 1.8 }}
            >
              {product.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => addToCart({ ...product, quantity: 1 })}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Нет в наличии' : 'Добавить в корзину'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={RouterLink}
                to="/cart"
                disabled={isOutOfStock}
              >
                Перейти в корзину
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={RouterLink}
                to="/catalog"
              >
                Назад в каталог
              </Button>
            </Box>
            {!isOutOfStock && (
              <Button
                variant="text"
                size="small"
                sx={{ mt: 2 }}
                component={RouterLink}
                to="/cart"
              >
                Перейти к оформлению
              </Button>
            )}
            {isOutOfStock && (
              <Typography sx={{ mt: 2 }} color="text.secondary">
                Все экземпляры временно раскуплены. Попробуйте позже или
                подпишитесь на обновления в профиле.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default ProductPage;
