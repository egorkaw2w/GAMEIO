// src/components/ui/HotkeysHelper.tsx
import { Box, Fab, Paper, Typography, Divider, Zoom } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { useState } from 'react';
import { useStore } from '../../store';
import { useLocation } from 'react-router-dom';

interface Hotkey {
    keys: string;
    description: string;
    category: string;
}

const HotkeysHelper = () => {
    const [open, setOpen] = useState(false);
    const { user } = useStore();
    const location = useLocation();

    const baseHotkeys: Hotkey[] = [
        { keys: 'Ctrl+H', description: 'Главная страница', category: 'Навигация' },
        { keys: 'Ctrl+P', description: 'Профиль', category: 'Навигация' },
        { keys: 'Ctrl+B', description: 'Корзина', category: 'Навигация' },
        { keys: 'Ctrl+O', description: 'Заказы', category: 'Навигация' },
        { keys: 'Ctrl+/', description: 'Справка (эта панель)', category: 'Навигация' },
        { keys: 'Ctrl+L', description: 'Выход', category: 'Действия' },
        { keys: 'Escape', description: 'Закрыть модальное окно', category: 'Действия' },
    ];

    // Горячие клавиши для админ-панели
    const adminHotkeys: Hotkey[] = [
        { keys: 'Alt+1', description: 'Менеджеры', category: 'Админ-панель' },
        { keys: 'Alt+2', description: 'Статистика', category: 'Админ-панель' },
        { keys: 'Alt+3', description: 'База данных', category: 'Админ-панель' },
    ];

    // Горячие клавиши для менеджер-панели
    const managerHotkeys: Hotkey[] = [
        { keys: 'Alt+1', description: 'Управление играми', category: 'Менеджер-панель' },
        { keys: 'Alt+2', description: 'Добавить ключ', category: 'Менеджер-панель' },
        { keys: 'Alt+3', description: 'Добавить аккаунт', category: 'Менеджер-панель' },
    ];

    let hotkeys = [...baseHotkeys];

    // Добавляем специфичные клавиши в зависимости от роли и страницы
    if (user?.role === 'admin' && location.pathname.startsWith('/admin')) {
        hotkeys = [...hotkeys, ...adminHotkeys];
    } else if (user?.role === 'manager' && (location.pathname.startsWith('/manager') || location.pathname.startsWith('/admin'))) {
        hotkeys = [...hotkeys, ...managerHotkeys];
    }

    const categories = Array.from(new Set(hotkeys.map(h => h.category)));

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000,
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <Zoom in={open}>
                <Paper
                    sx={{
                        position: 'absolute',
                        bottom: 70,
                        right: 0,
                        width: 320,
                        p: 2,
                        boxShadow: 6,
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="h6" gutterBottom fontWeight={700}>
                        Горячие клавиши
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {categories.map((category, idx) => (
                        <Box key={category} sx={{ mb: idx < categories.length - 1 ? 2 : 0 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}
                            >
                                {category}
                            </Typography>
                            {hotkeys
                                .filter(h => h.category === category)
                                .map((hotkey) => (
                                    <Box
                                        key={hotkey.keys}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            py: 0.5,
                                        }}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            {hotkey.description}
                                        </Typography>
                                        <Box
                                            sx={{
                                                bgcolor: 'grey.200',
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1,
                                                fontFamily: 'monospace',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: 'grey.800',
                                            }}
                                        >
                                            {hotkey.keys}
                                        </Box>
                                    </Box>
                                ))}
                        </Box>
                    ))}
                </Paper>
            </Zoom>

            <Fab
                color="primary"
                size="medium"
                sx={{
                    boxShadow: 4,
                    '&:hover': {
                        boxShadow: 8,
                    },
                }}
            >
                <HelpOutline />
            </Fab>
        </Box>
    );
};

export default HotkeysHelper;
