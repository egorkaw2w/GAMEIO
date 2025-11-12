// src/components/layout/Header.tsx
import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Button,
    Container,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useScrollTrigger,
    Divider,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    ShoppingCart,
    Person,
    Logout,
    ShoppingBag,
    Settings,
    AdminPanelSettings,
    Menu as MenuIcon,
    SportsEsports,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useState } from 'react';

const Header = () => {
    const navigate = useNavigate();
    const { user, cart, logout } = useStore();
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

    const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

    // Elevation on scroll effect
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleOpenMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMobileMenuAnchor(event.currentTarget);
    };

    const handleCloseMobileMenu = () => {
        setMobileMenuAnchor(null);
    };

    const handleLogout = () => {
        logout();
        handleCloseUserMenu();
        navigate('/');
    };

    const handleNavigate = (path: string) => {
        handleCloseUserMenu();
        handleCloseMobileMenu();
        navigate(path);
    };

    return (
        <AppBar
            position="sticky"
            elevation={trigger ? 4 : 0}
            sx={{
                transition: 'box-shadow 220ms ease',
                backgroundColor: trigger ? 'primary.main' : 'primary.dark',
            }}
        >
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ gap: 2 }}>
                    {/* Logo */}
                    <SportsEsports sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, fontSize: 32 }} />
                    <Typography
                        variant="h5"
                        component={RouterLink}
                        to="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontWeight: 700,
                            letterSpacing: '.1rem',
                            color: 'inherit',
                            textDecoration: 'none',
                            '&:hover': {
                                opacity: 0.8,
                            },
                        }}
                    >
                        GameIO
                    </Typography>

                    {/* Mobile menu */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            onClick={handleOpenMobileMenu}
                            color="inherit"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            anchorEl={mobileMenuAnchor}
                            open={Boolean(mobileMenuAnchor)}
                            onClose={handleCloseMobileMenu}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                        >
                            <MenuItem onClick={() => handleNavigate('/')}>
                                <Typography textAlign="center">Главная</Typography>
                            </MenuItem>
                            <MenuItem onClick={() => handleNavigate('/catalog')}>
                                <Typography textAlign="center">Каталог</Typography>
                            </MenuItem>
                            {user && (
                                <MenuItem onClick={() => handleNavigate('/orders')}>
                                    <Typography textAlign="center">Мои заказы</Typography>
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>

                    {/* Mobile logo */}
                    <SportsEsports sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
                    <Typography
                        variant="h6"
                        component={RouterLink}
                        to="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'flex', md: 'none' },
                            flexGrow: 1,
                            fontWeight: 700,
                            letterSpacing: '.1rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        GameIO
                    </Typography>

                    {/* Desktop menu */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                        <Button
                            component={RouterLink}
                            to="/"
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            Главная
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/catalog"
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            Каталог
                        </Button>
                        {user && (
                            <Button
                                component={RouterLink}
                                to="/orders"
                                sx={{
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                Мои заказы
                            </Button>
                        )}
                    </Box>

                    {/* Cart icon */}
                    <IconButton
                        component={RouterLink}
                        to="/cart"
                        size="large"
                        color="inherit"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                        }}
                    >
                        <Badge badgeContent={cartCount} color="secondary">
                            <ShoppingCart />
                        </Badge>
                    </IconButton>

                    {/* User menu */}
                    {user ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {(user.role === 'admin' || user.role === 'manager') && (
                                <IconButton
                                    component={RouterLink}
                                    to="/admin"
                                    size="large"
                                    color="inherit"
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                    }}
                                >
                                    <AdminPanelSettings />
                                </IconButton>
                            )}

                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar
                                    sx={{
                                        bgcolor: 'secondary.main',
                                        width: 40,
                                        height: 40,
                                    }}
                                >
                                    {user.username[0].toUpperCase()}
                                </Avatar>
                            </IconButton>

                            <Menu
                                sx={{ mt: '45px' }}
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        {user.username}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {user.email}
                                    </Typography>
                                </Box>
                                <Divider />
                                <MenuItem onClick={() => handleNavigate('/profile')}>
                                    <ListItemIcon>
                                        <Person fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Профиль</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={() => handleNavigate('/orders')}>
                                    <ListItemIcon>
                                        <ShoppingBag fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Мои заказы</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={() => handleNavigate('/settings')}>
                                    <ListItemIcon>
                                        <Settings fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Настройки</ListItemText>
                                </MenuItem>
                                <Divider />
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon>
                                        <Logout fontSize="small" color="error" />
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography color="error">Выйти</Typography>
                                    </ListItemText>
                                </MenuItem>
                            </Menu>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                component={RouterLink}
                                to="/login"
                                variant="outlined"
                                sx={{
                                    color: 'white',
                                    borderColor: 'white',
                                    '&:hover': {
                                        borderColor: 'white',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                Войти
                            </Button>
                            <Button
                                component={RouterLink}
                                to="/register"
                                variant="contained"
                                color="secondary"
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'secondary.dark',
                                    },
                                }}
                            >
                                Регистрация
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Header;
