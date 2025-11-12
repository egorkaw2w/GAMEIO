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
