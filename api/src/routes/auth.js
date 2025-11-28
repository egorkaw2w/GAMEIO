// api/src/routes/auth.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { logAction } = require('./logs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_1234567890';

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 *
 * ТРАНЗАКЦИЯ: Атомарное создание пользователя с назначением роли и настроек
 * - Создание записи в Users
 * - Назначение роли 'user' в UserRoles
 * - Создание настроек по умолчанию в UserSettings
 * При ошибке на любом этапе - откат всех изменений (ROLLBACK)
 */
router.post('/register', validateRegistration, async (req, res) => {
  const { username, email, password } = req.body;
  const client = await pool.connect();

  try {
    // Начинаем транзакцию
    await client.query('BEGIN');

    // 1. Хешируем пароль и создаём пользователя
    const hashed = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO Users (username, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, email, hashed]
    );
    const user = userResult.rows[0];

    // 2. Назначаем роль 'user' по умолчанию
    const roleRes = await client.query('SELECT id FROM Roles WHERE name = $1', ['user']);
    if (roleRes.rows.length === 0) {
      throw new Error('Роль user не найдена в базе данных');
    }
    await client.query(
      'INSERT INTO UserRoles (user_id, role_id) VALUES ($1, $2)',
      [user.id, roleRes.rows[0].id]
    );

    // 3. Создаём настройки пользователя по умолчанию
    await client.query(
      `INSERT INTO UserSettings (user_id, theme, date_format, page_size)
       VALUES ($1, 'light', 'DD.MM.YYYY', 10)`,
      [user.id]
    );

    // Фиксируем транзакцию
    await client.query('COMMIT');

    const token = jwt.sign({ user_id: user.id, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });

    // Логируем регистрацию (после успешной транзакции)
    await logAction(user.id, 'USER_REGISTER', 'Users', null, { username: user.username, email: user.email });

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: 'user' }
    });
  } catch (err) {
    // Откатываем транзакцию при любой ошибке
    await client.query('ROLLBACK');
    console.error('Error during registration:', err);
    if (err.code === '23505') { // Нарушение уникальности
      return res.status(400).json({ error: 'Пользователь с таким email или username уже существует' });
    }
    res.status(500).json({ error: 'Ошибка при регистрации' });
  } finally {
    // Освобождаем соединение
    client.release();
  }
});

// Логин
router.post('/login', validateLogin, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.password_hash,
        COALESCE(
          (SELECT r.name FROM UserRoles ur
           JOIN Roles r ON ur.role_id = r.id
           WHERE ur.user_id = u.id
           LIMIT 1),
          'user'
        ) as role
      FROM Users u
      WHERE u.email = $1
    `, [email]);

    const user = result.rows[0];

    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign({ user_id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    // Логируем успешный вход
    await logAction(user.id, 'USER_LOGIN', 'Users', null, { username: user.username, role: user.role });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
});

module.exports = router;