// src/routes/password-reset.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../db');
const { sendPasswordResetEmail } = require('../services/emailService');

/**
 * POST /api/password-reset/request
 * Запрос на восстановление пароля
 * @body {string} email - Email пользователя
 */
router.post('/request', async (req, res) => {
    try {
        const { email } = req.body;

        // Валидация
        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }

        // Проверка формата email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Некорректный формат email' });
        }

        // Ищем пользователя по email
        const userResult = await pool.query(
            'SELECT id, username, email FROM Users WHERE email = $1',
            [email]
        );

        // Даже если пользователь не найден, возвращаем успех для безопасности
        // (чтобы злоумышленники не могли проверить наличие email в системе)
        if (userResult.rows.length === 0) {
            return res.json({
                message: 'Если этот email зарегистрирован в системе, мы отправили инструкции по восстановлению пароля',
            });
        }

        const user = userResult.rows[0];

        // Генерируем уникальный токен
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Хэшируем токен для безопасного хранения
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Срок действия токена - 15 минут
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Удаляем старые неиспользованные токены этого пользователя
        await pool.query(
            'DELETE FROM PasswordResetTokens WHERE user_id = $1 AND used = FALSE',
            [user.id]
        );

        // Сохраняем токен в БД
        await pool.query(
            'INSERT INTO PasswordResetTokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, hashedToken, expiresAt]
        );

        // Отправляем email асинхронно (не блокируем ответ)
        sendPasswordResetEmail(user.email, user.username, resetToken)
            .then(() => {
                console.log('✅ Email успешно отправлен на:', user.email);
            })
            .catch((emailError) => {
                console.error('❌ Ошибка отправки email:', emailError.message);
            });

        // Сразу отвечаем пользователю (не ждем отправки email)
        res.json({
            message: 'Если этот email зарегистрирован в системе, мы отправили инструкции по восстановлению пароля',
        });
    } catch (err) {
        console.error('Error in password reset request:', err);
        res.status(500).json({ error: 'Ошибка сервера при запросе восстановления пароля' });
    }
});

/**
 * POST /api/password-reset/verify
 * Проверка валидности токена
 * @body {string} token - Токен восстановления
 */
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Токен обязателен' });
        }

        // Хэшируем токен для поиска в БД
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Ищем токен в БД
        const tokenResult = await pool.query(
            `SELECT prt.*, u.username, u.email
             FROM PasswordResetTokens prt
             JOIN Users u ON prt.user_id = u.id
             WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
            [hashedToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                error: 'Недействительный или истекший токен восстановления пароля',
                expired: true
            });
        }

        const tokenData = tokenResult.rows[0];

        res.json({
            valid: true,
            email: tokenData.email,
            username: tokenData.username
        });
    } catch (err) {
        console.error('Error verifying reset token:', err);
        res.status(500).json({ error: 'Ошибка сервера при проверке токена' });
    }
});

/**
 * POST /api/password-reset/reset
 * Сброс пароля с использованием токена
 * @body {string} token - Токен восстановления
 * @body {string} newPassword - Новый пароль
 */
router.post('/reset', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Валидация
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Токен и новый пароль обязательны' });
        }

        // Валидация пароля
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
        }

        // Хэшируем токен для поиска в БД
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Ищем токен в БД
        const tokenResult = await pool.query(
            `SELECT prt.*, u.id as user_id, u.username
             FROM PasswordResetTokens prt
             JOIN Users u ON prt.user_id = u.id
             WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
            [hashedToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                error: 'Недействительный или истекший токен восстановления пароля',
                expired: true
            });
        }

        const tokenData = tokenResult.rows[0];

        // Хэшируем новый пароль
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Обновляем пароль пользователя
        await pool.query(
            'UPDATE Users SET password_hash = $1 WHERE id = $2',
            [passwordHash, tokenData.user_id]
        );

        // Помечаем токен как использованный
        await pool.query(
            'UPDATE PasswordResetTokens SET used = TRUE WHERE id = $1',
            [tokenData.id]
        );

        // Удаляем все другие активные токены этого пользователя
        await pool.query(
            'UPDATE PasswordResetTokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
            [tokenData.user_id]
        );

        res.json({
            message: 'Пароль успешно изменен! Теперь вы можете войти с новым паролем.',
            username: tokenData.username
        });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ error: 'Ошибка сервера при сбросе пароля' });
    }
});

module.exports = router;
