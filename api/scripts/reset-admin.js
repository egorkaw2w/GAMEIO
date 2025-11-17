// Скрипт для сброса пароля админа
const { pool } = require('../src/db');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Обновляем пароль админа
        await pool.query(
            'UPDATE Users SET password_hash = $1 WHERE email = $2',
            [hashedPassword, 'admin@example.com']
        );

        console.log('✅ Пароль админа успешно сброшен на: admin123');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');

        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Ошибка при сбросе пароля:', err);
        await pool.end();
        process.exit(1);
    }
}

resetAdmin();
