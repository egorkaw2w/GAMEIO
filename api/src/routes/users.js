// api/src/routes/users.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateIdParam } = require('../middleware/validation');
const bcrypt = require('bcryptjs');

/**
 * GET /api/users
 * Получить список всех пользователей (только для админов)
 */
router.get('/', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'name', r.name)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as roles
      FROM Users u
      LEFT JOIN UserRoles ur ON u.id = ur.user_id
      LEFT JOIN Roles r ON ur.role_id = r.id
      GROUP BY u.id, u.username, u.email, u.created_at
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Не удалось получить список пользователей' });
  }
});

/**
 * GET /api/users/me
 * Получить информацию о текущем пользователе
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'name', r.name)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as roles
      FROM Users u
      LEFT JOIN UserRoles ur ON u.id = ur.user_id
      LEFT JOIN Roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id, u.username, u.email, u.created_at
    `, [req.user.user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Не удалось получить информацию о пользователе' });
  }
});

/**
 * GET /api/users/:id
 * Получить информацию о пользователе по ID
 */
router.get('/:id', verifyToken, validateIdParam('id'), async (req, res) => {
  const userId = req.params.id;

  // Пользователи могут видеть только свою информацию, админы - всех
  if (req.user.user_id !== parseInt(userId) && !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', r.id, 'name', r.name)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as roles
      FROM Users u
      LEFT JOIN UserRoles ur ON u.id = ur.user_id
      LEFT JOIN Roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id, u.username, u.email, u.created_at
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Не удалось получить информацию о пользователе' });
  }
});

/**
 * PUT /api/users/:id
 * Обновить информацию о пользователе
 */
router.put('/:id', verifyToken, validateIdParam('id'), async (req, res) => {
  const userId = req.params.id;
  const { username, email, password } = req.body;

  // Пользователи могут обновлять только свою информацию, админы - всех
  if (req.user.user_id !== parseInt(userId) && !['admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(userId);

    const query = `
      UPDATE Users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, created_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    if (err.code === '23505') { // Уникальное ограничение
      return res.status(400).json({ error: 'Пользователь с таким email или username уже существует' });
    }
    res.status(500).json({ error: 'Не удалось обновить пользователя' });
  }
});

/**
 * PATCH /api/users/me/username
 * Обновить имя пользователя текущего пользователя
 */
router.patch('/me/username', verifyToken, async (req, res) => {
  const { username } = req.body;

  if (!username || username.trim().length < 3) {
    return res.status(400).json({ error: 'Имя пользователя должно содержать минимум 3 символа' });
  }

  try {
    const result = await pool.query(
      'UPDATE Users SET username = $1 WHERE id = $2 RETURNING id, username, email, created_at',
      [username.trim(), req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ message: 'Имя пользователя успешно обновлено', user: result.rows[0] });
  } catch (err) {
    console.error('Error updating username:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
    }
    res.status(500).json({ error: 'Не удалось обновить имя пользователя' });
  }
});

/**
 * PATCH /api/users/me/email
 * Обновить email текущего пользователя
 */
router.patch('/me/email', verifyToken, async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Неверный формат email' });
  }

  try {
    const result = await pool.query(
      'UPDATE Users SET email = $1 WHERE id = $2 RETURNING id, username, email, created_at',
      [email.trim().toLowerCase(), req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ message: 'Email успешно обновлён', user: result.rows[0] });
  } catch (err) {
    console.error('Error updating email:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    res.status(500).json({ error: 'Не удалось обновить email' });
  }
});

/**
 * PATCH /api/users/me/password
 * Обновить пароль текущего пользователя
 */
router.patch('/me/password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Необходимо указать текущий и новый пароль' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
  }

  try {
    // Получаем текущий хеш пароля
    const userResult = await pool.query(
      'SELECT id, password_hash FROM Users WHERE id = $1',
      [req.user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];

    // Проверяем текущий пароль
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Неверный текущий пароль' });
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await pool.query(
      'UPDATE Users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, req.user.user_id]
    );

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Не удалось изменить пароль' });
  }
});

/**
 * POST /api/users/create-manager
 * Создать нового менеджера (только для админов)
 */
router.post('/create-manager', verifyToken, requireRole(['admin']), async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Необходимо указать username, email и password' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
  }

  try {
    // Создаём пользователя
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      `INSERT INTO Users (username, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, email, hashedPassword]
    );
    const user = userResult.rows[0];

    // Назначаем роль 'manager'
    const roleRes = await pool.query('SELECT id FROM Roles WHERE name = $1', ['manager']);
    if (roleRes.rows.length > 0) {
      await pool.query(
        'INSERT INTO UserRoles (user_id, role_id) VALUES ($1, $2)',
        [user.id, roleRes.rows[0].id]
      );
    }

    res.status(201).json({
      message: 'Менеджер успешно создан',
      user: { id: user.id, username: user.username, email: user.email, role: 'manager' }
    });
  } catch (err) {
    console.error('Error creating manager:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Пользователь с таким email или username уже существует' });
    }
    res.status(500).json({ error: 'Не удалось создать менеджера' });
  }
});

/**
 * DELETE /api/users/:id
 * Удалить пользователя (только для админов)
 */
router.delete('/:id', verifyToken, requireRole(['admin']), validateIdParam('id'), async (req, res) => {
  const userId = req.params.id;

  // Нельзя удалить самого себя
  if (req.user.user_id === parseInt(userId)) {
    return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  }

  try {
    const result = await pool.query('DELETE FROM Users WHERE id = $1 RETURNING id', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ message: 'Пользователь успешно удалён', id: userId });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Не удалось удалить пользователя' });
  }
});

/**
 * POST /api/users/:id/roles
 * Добавить роль пользователю (только для админов)
 */
router.post('/:id/roles', verifyToken, requireRole(['admin']), validateIdParam('id'), async (req, res) => {
  const userId = req.params.id;
  const { role_id } = req.body;

  if (!role_id) {
    return res.status(400).json({ error: 'role_id обязателен' });
  }

  try {
    // Проверяем, существует ли пользователь
    const userCheck = await pool.query('SELECT id FROM Users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверяем, существует ли роль
    const roleCheck = await pool.query('SELECT id FROM Roles WHERE id = $1', [role_id]);
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Роль не найдена' });
    }

    // Добавляем роль пользователю
    await pool.query(
      'INSERT INTO UserRoles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING',
      [userId, role_id]
    );

    res.json({ message: 'Роль успешно добавлена' });
  } catch (err) {
    console.error('Error adding role to user:', err);
    res.status(500).json({ error: 'Не удалось добавить роль пользователю' });
  }
});

/**
 * DELETE /api/users/:id/roles/:roleId
 * Удалить роль у пользователя (только для админов)
 */
router.delete('/:id/roles/:roleId', verifyToken, requireRole(['admin']), async (req, res) => {
  const userId = req.params.id;
  const roleId = req.params.roleId;

  try {
    const result = await pool.query(
      'DELETE FROM UserRoles WHERE user_id = $1 AND role_id = $2 RETURNING id',
      [userId, roleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Роль не найдена у пользователя' });
    }

    res.json({ message: 'Роль успешно удалена' });
  } catch (err) {
    console.error('Error removing role from user:', err);
    res.status(500).json({ error: 'Не удалось удалить роль у пользователя' });
  }
});

/**
 * GET /api/users/:id/orders
 * Получить заказы пользователя
 */
router.get('/:id/orders', verifyToken, validateIdParam('id'), async (req, res) => {
  const userId = req.params.id;

  // Пользователи могут видеть только свои заказы, админы - всех
  if (req.user.user_id !== parseInt(userId) && !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.total_price,
        o.status,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'item_type', oi.item_type,
              'item_id', oi.item_id,
              'quantity', oi.quantity
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items
      FROM Orders o
      LEFT JOIN OrderItems oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id, o.total_price, o.status, o.created_at
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ error: 'Не удалось получить заказы пользователя' });
  }
});

module.exports = router;
