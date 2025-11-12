// api/src/routes/auth.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateRegistration, validateLogin } = require('../middleware/validation');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_1234567890';

// Регистрация
router.post('/register', validateRegistration, async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO Users (username, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, email, hashed]
    );
    const user = result.rows[0];

    // Назначаем роль 'user' по умолчанию
    const roleRes = await pool.query('SELECT id FROM Roles WHERE name = $1', ['user']);
    if (roleRes.rows.length > 0) {
      await pool.query(
        'INSERT INTO UserRoles (user_id, role_id) VALUES ($1, $2)',
        [user.id, roleRes.rows[0].id]
      );
    }

    const token = jwt.sign({ user_id: user.id, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: 'user' }
    });
  } catch (err) {
    console.error('Error during registration:', err);
    if (err.code === '23505') { // Нарушение уникальности
      return res.status(400).json({ error: 'Пользователь с таким email или username уже существует' });
    }
    res.status(500).json({ error: 'Ошибка при регистрации' });
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