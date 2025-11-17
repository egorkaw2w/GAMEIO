// src/pages/CatalogPage.tsx
import { useState, useMemo, useCallback } from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Divider,
    Drawer,
    FormControlLabel,
    FormGroup,
    IconButton,
    Paper,
    Slider,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    FilterList,
    Search,
    Clear,
} from '@mui/icons-material';
import ProductCard from '../features/products/ProductCard';
import { useProducts } from '../features/products/hooks/useProducts';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';

const CatalogPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { products, loading, error } = useProducts();

    // Состояние фильтров
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Debounced значения для оптимизации производительности
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const debouncedPriceRange = useDebounce(priceRange, 400);

    // Получаем уникальные платформы из продуктов
    const availablePlatforms = useMemo(() => {
        const platforms = new Set(products.map(p => p.platform));
        return Array.from(platforms).sort();
    }, [products]);

    // Получаем диапазон цен
    const priceExtent = useMemo(() => {
        if (products.length === 0) return [0, 10000];
        const prices = products.map(p => p.price);
        return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
    }, [products]);

    // Фильтрация продуктов (используем debounced значения)
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            // Фильтр по поиску (debounced)
            const matchesSearch = product.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

            // Фильтр по цене (debounced)
            const matchesPrice = product.price >= debouncedPriceRange[0] && product.price <= debouncedPriceRange[1];

            // Фильтр по платформе
            const matchesPlatform = selectedPlatforms.length === 0 ||
                selectedPlatforms.includes(product.platform);

            return matchesSearch && matchesPrice && matchesPlatform;
        });
    }, [products, debouncedSearchQuery, debouncedPriceRange, selectedPlatforms]);

    const handlePlatformToggle = useCallback((platform: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    }, []);

    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        setPriceRange(priceExtent as [number, number]);
        setSelectedPlatforms([]);
    }, [priceExtent]);

    const hasActiveFilters = useMemo(() => {
        return searchQuery !== '' ||
            priceRange[0] !== priceExtent[0] ||
            priceRange[1] !== priceExtent[1] ||
            selectedPlatforms.length > 0;
    }, [searchQuery, priceRange, priceExtent, selectedPlatforms]);

    // Компонент фильтров (мемоизированный)
    const FiltersSidebar = useCallback(() => (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 16 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                    Фильтры
                </Typography>
                {hasActiveFilters && (
                    <Button
                        size="small"
                        startIcon={<Clear />}
                        onClick={handleResetFilters}
                    >
                        Сбросить
                    </Button>
                )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Поиск */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Поиск
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Название игры..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Цена */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Цена (₽)
                </Typography>
                <Box sx={{ px: 1 }}>
                    <Slider
                        value={priceRange}
                        onChange={(_, newValue) => setPriceRange(newValue as [number, number])}
                        valueLabelDisplay="auto"
                        min={priceExtent[0]}
                        max={priceExtent[1]}
                        marks={[
                            { value: priceExtent[0], label: `${priceExtent[0]}₽` },
                            { value: priceExtent[1], label: `${priceExtent[1]}₽` },
                        ]}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                        size="small"
                        label="От"
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        InputProps={{ inputProps: { min: priceExtent[0], max: priceRange[1] } }}
                    />
                    <TextField
                        size="small"
                        label="До"
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        InputProps={{ inputProps: { min: priceRange[0], max: priceExtent[1] } }}
                    />
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Платформы */}
            <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Платформа
                </Typography>
                <FormGroup>
                    {availablePlatforms.map(platform => (
                        <FormControlLabel
                            key={platform}
                            control={
                                <Checkbox
                                    checked={selectedPlatforms.includes(platform)}
                                    onChange={() => handlePlatformToggle(platform)}
                                />
                            }
                            label={`${platform} (${products.filter(p => p.platform === platform).length})`}
                        />
                    ))}
                </FormGroup>
            </Box>
        </Paper>
    ), [searchQuery, priceRange, priceExtent, selectedPlatforms, availablePlatforms, products, hasActiveFilters, handleResetFilters, handlePlatformToggle]);

    if (loading) return <LoadingSpinner />;

    return (
        <Box>
            {/* Заголовок и кнопка фильтров на мобильных */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700}>
                    Каталог
                </Typography>
                {isMobile && (
                    <IconButton
                        color="primary"
                        onClick={() => setDrawerOpen(true)}
                        sx={{ bgcolor: 'primary.light' }}
                    >
                        <FilterList />
                    </IconButton>
                )}
            </Box>

            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 3 }}>
                {/* Sidebar фильтров (desktop) */}
                {!isMobile && (
                    <Box sx={{ width: 280, flexShrink: 0 }}>
                        <FiltersSidebar />
                    </Box>
                )}

                {/* Список продуктов */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Информация о результатах */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Найдено товаров: {filteredProducts.length}
                    </Typography>

                    {filteredProducts.length === 0 ? (
                        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Товары не найдены
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Попробуйте изменить параметры фильтрации
                            </Typography>
                            {hasActiveFilters && (
                                <Button variant="outlined" onClick={handleResetFilters}>
                                    Сбросить фильтры
                                </Button>
                            )}
                        </Paper>
                    ) : (
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 3,
                                gridTemplateColumns: {
                                    xs: 'repeat(1, minmax(0, 1fr))',
                                    sm: 'repeat(2, minmax(0, 1fr))',
                                    lg: 'repeat(3, minmax(0, 1fr))',
                                },
                            }}
                        >
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Drawer фильтров (mobile) */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <Box sx={{ width: 300, p: 2 }}>
                    <FiltersSidebar />
                </Box>
            </Drawer>
        </Box>
    );
};

export default CatalogPage;