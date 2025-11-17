import { useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Fade,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  VpnKey,
  AccountCircle,
  CheckCircle,
  Info,
} from '@mui/icons-material';
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
  const [purchaseType, setPurchaseType] = useState<'key' | 'account'>('key');

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

  // Вычисляем цену в зависимости от типа покупки
  const currentPrice = purchaseType === 'key'
    ? (product.min_key_price ?? product.price)
    : (product.min_account_price ?? product.price);

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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h3" gutterBottom fontWeight={700}>
                {product.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip label={product.platform} color="primary" size="medium" />
                {!isOutOfStock && <Chip label="В наличии" color="success" icon={<CheckCircle />} />}
                {isOutOfStock && <Chip label="Нет в наличии" color="error" />}
              </Box>
            </Box>

            {/* Выбор типа покупки */}
            {product.availability && (
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Тип покупки
                </Typography>
                <ToggleButtonGroup
                  value={purchaseType}
                  exclusive
                  onChange={(_, newType) => newType && setPurchaseType(newType)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  <ToggleButton
                    value="key"
                    disabled={!product.availability.keys}
                    sx={{ py: 1.5 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VpnKey />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Ключ активации
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.availability.keys} шт.
                        </Typography>
                      </Box>
                    </Box>
                  </ToggleButton>
                  <ToggleButton
                    value="account"
                    disabled={!product.availability.accounts}
                    sx={{ py: 1.5 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountCircle />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Аккаунт
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.availability.accounts} шт.
                        </Typography>
                      </Box>
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>
                <Alert severity="info" icon={<Info />}>
                  {purchaseType === 'key'
                    ? 'Ключ для активации в вашей учетной записи'
                    : 'Полноценный аккаунт с игрой'}
                </Alert>
              </Paper>
            )}

            {/* Цена */}
            <Card elevation={3} sx={{ borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700}>
                  {currentPrice} ₽
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Мгновенная доставка на email
                </Typography>
              </CardContent>
            </Card>

            {/* Описание */}
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Описание
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.8 }}
              >
                {product.description}
              </Typography>
            </Box>

            <Divider />

            {/* Преимущества */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Что вы получите:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2">Мгновенная доставка после оплаты</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2">Гарантия работоспособности</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2">Поддержка 24/7</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2">Возврат в случае проблем</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Кнопки действий */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => addToCart({ ...product, quantity: 1, itemType: purchaseType })}
                disabled={isOutOfStock}
                sx={{ flex: 1 }}
              >
                {isOutOfStock ? 'Нет в наличии' : 'Добавить в корзину'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={RouterLink}
                to="/catalog"
              >
                Назад
              </Button>
            </Box>

            {!isOutOfStock && (
              <Button
                variant="outlined"
                fullWidth
                component={RouterLink}
                to="/cart"
              >
                Перейти к оформлению
              </Button>
            )}

            {isOutOfStock && (
              <Alert severity="warning">
                Все экземпляры временно раскуплены. Попробуйте позже или
                подпишитесь на обновления в профиле.
              </Alert>
            )}
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default ProductPage;
