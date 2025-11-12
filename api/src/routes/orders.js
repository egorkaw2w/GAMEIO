// api/src/routes/orders.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateOrderCreation, validateIdParam } = require('../middleware/validation');

/**
 * GET /api/orders
 * Получить список всех заказов
 * Пользователи видят только свои заказы, админы/менеджеры - все
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = `
      SELECT
        o.id,
        o.user_id,
        u.username,
        o.total_price,
        o.status,
        o.created_at,
        COUNT(oi.id) as items_count
      FROM Orders o
      LEFT JOIN Users u ON o.user_id = u.id
      LEFT JOIN OrderItems oi ON o.id = oi.order_id
    `;

    const values = [];
    let paramCount = 1;

    // Обычные пользователи видят только свои заказы
    if (!['admin', 'manager'].includes(req.user.role)) {
      query += ` WHERE o.user_id = $${paramCount}`;
      values.push(req.user.user_id);
      paramCount++;
    }

    query += `
      GROUP BY o.id, o.user_id, u.username, o.total_price, o.status, o.created_at
      ORDER BY o.created_at DESC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Не удалось получить список заказов' });
  }
});

/**
 * GET /api/orders/:id
 * Получить информацию о заказе по ID
 */
router.get('/:id', verifyToken, validateIdParam('id'), async (req, res) => {
  const orderId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.user_id,
        u.username,
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
      LEFT JOIN Users u ON o.user_id = u.id
      LEFT JOIN OrderItems oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id, o.user_id, u.username, o.total_price, o.status, o.created_at
    `, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = result.rows[0];

    // Проверка прав доступа
    if (order.user_id !== req.user.user_id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Не удалось получить информацию о заказе' });
  }
});

/**
 * POST /api/orders
 * Создать новый заказ
 */
router.post('/', verifyToken, validateOrderCreation, async (req, res) => {
  const { items } = req.body; // [{ game_id: 1, platform_id: 1 }]
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Создаём заказ
    const orderRes = await client.query(
      `INSERT INTO Orders (user_id, total_price, status)
       VALUES ($1, 0, 'pending') RETURNING id`,
      [req.user.user_id]
    );
    const orderId = orderRes.rows[0].id;
    let total = 0;

    // Добавляем товары в заказ
    for (const item of items) {
      // Пытаемся найти доступный аккаунт
      const accountRes = await client.query(
        `SELECT id, price FROM Accounts
         WHERE game_id = $1 AND status = 'available'
         LIMIT 1`,
        [item.game_id]
      );

      if (accountRes.rows.length > 0) {
        const account = accountRes.rows[0];
        total += parseFloat(account.price);

        await client.query(
          `INSERT INTO OrderItems (order_id, item_type, item_id, quantity)
           VALUES ($1, 'account', $2, 1)`,
          [orderId, account.id]
        );

        // Помечаем аккаунт как проданный
        await client.query(
          `UPDATE Accounts SET status = 'sold' WHERE id = $1`,
          [account.id]
        );
      } else {
        // Пытаемся найти доступный ключ
        const keyRes = await client.query(
          `SELECT id, price FROM Keys
           WHERE game_id = $1 AND status = 'available'
           LIMIT 1`,
          [item.game_id]
        );

        if (keyRes.rows.length > 0) {
          const key = keyRes.rows[0];
          total += parseFloat(key.price);

          await client.query(
            `INSERT INTO OrderItems (order_id, item_type, item_id, quantity)
             VALUES ($1, 'key', $2, 1)`,
            [orderId, key.id]
          );

          // Помечаем ключ как проданный
          await client.query(
            `UPDATE Keys SET status = 'sold' WHERE id = $1`,
            [key.id]
          );
        } else {
          throw new Error(`Товар с game_id=${item.game_id} недоступен`);
        }
      }
    }

    // Обновляем общую сумму и статус заказа
    await client.query(
      `UPDATE Orders SET total_price = $1, status = 'completed' WHERE id = $2`,
      [total, orderId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      id: orderId,
      total_price: total,
      status: 'completed',
      message: 'Заказ успешно создан'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * PATCH /api/orders/:id/cancel
 * Отменить заказ
 */
router.patch('/:id/cancel', verifyToken, validateIdParam('id'), async (req, res) => {
  const orderId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Получаем информацию о заказе
    const orderRes = await client.query(
      'SELECT id, user_id, status FROM Orders WHERE id = $1',
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderRes.rows[0];

    // Проверка прав доступа
    if (order.user_id !== req.user.user_id && !['admin'].includes(req.user.role)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    // Проверка статуса заказа
    if (order.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Заказ уже отменён' });
    }

    // Получаем товары заказа
    const itemsRes = await client.query(
      'SELECT item_type, item_id FROM OrderItems WHERE order_id = $1',
      [orderId]
    );

    // Возвращаем товары в статус available
    for (const item of itemsRes.rows) {
      if (item.item_type === 'account') {
        await client.query(
          `UPDATE Accounts SET status = 'available' WHERE id = $1`,
          [item.item_id]
        );
      } else if (item.item_type === 'key') {
        await client.query(
          `UPDATE Keys SET status = 'available' WHERE id = $1`,
          [item.item_id]
        );
      }
    }

    // Обновляем статус заказа
    await client.query(
      `UPDATE Orders SET status = 'cancelled' WHERE id = $1`,
      [orderId]
    );

    await client.query('COMMIT');

    res.json({ message: 'Заказ успешно отменён', id: orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error cancelling order:', err);
    res.status(500).json({ error: 'Не удалось отменить заказ' });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/orders/:id
 * Удалить заказ (только для админов)
 */
router.delete('/:id', verifyToken, requireRole(['admin']), validateIdParam('id'), async (req, res) => {
  const orderId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM Orders WHERE id = $1 RETURNING id', [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json({ message: 'Заказ успешно удалён', id: orderId });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Не удалось удалить заказ' });
  }
});

module.exports = router;