// src/components/admin/BackupRestoreButtons.tsx
import { Button, Box } from '@mui/material';
import api from '../../lib/api';

const BackupRestoreButtons = () => {
    const handleBackup = async () => {
        if (!confirm('Создать бэкап?')) return;
        try {
            const res = await api.post('/admin/backup');
            alert(res.data.message);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Ошибка');
        }
    };

    const handleRestore = async () => {
        const file = prompt('Путь к бэкапу (backups/backup_20251111.sql)');
        if (!file || !confirm('Восстановить? ДАННЫЕ БУДУТ ПЕРЕЗАПИСАНЫ!')) return;
        try {
            const res = await api.post('/admin/restore', { backup_file: file });
            alert(res.data.message);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Ошибка');
        }
    };

    return (
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={handleBackup}>Бэкап</Button>
            <Button variant="outlined" color="error" onClick={handleRestore}>Restore</Button>
        </Box>
    );
};

export default BackupRestoreButtons;