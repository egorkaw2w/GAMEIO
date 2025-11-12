// api/src/routes/statistics.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/statistics/overview
 * Общая статистика (для админов и менеджеров)
 */
router.get('/overview', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM Users) as total_users,
        (SELECT COUNT(*) FROM Orders WHERE status = 'completed') as completed_orders,
        (SELECT COUNT(*) FROM Orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM Orders WHERE status = 'cancelled') as cancelled_orders,
        (SELECT COALESCE(SUM(total_price), 0) FROM Orders WHERE status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM Games) as total_games,
        (SELECT COUNT(*) FROM Accounts WHERE status = 'available') as available_accounts,
        (SELECT COUNT(*) FROM Keys WHERE status = 'available') as available_keys,
        (SELECT COUNT(*) FROM Accounts WHERE status = 'sold') as sold_accounts,
        (SELECT COUNT(*) FROM Keys WHERE status = 'sold') as sold_keys
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching overview statistics:', err);
    res.status(500).json({ error: 'Не удалось получить общую статистику' });
  }
});

/**
 * GET /api/statistics/sales-by-game
 * Статистика продаж по играм
 */
router.get('/sales-by-game', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { start_date, end_date, limit = 10 } = req.query;

    let query = `
      SELECT
        g.id as game_id,
        g.title as game_title,
        p.name as platform_name,
        COUNT(DISTINCT o.id) as orders_count,
        COUNT(oi.id) as items_sold,
        COALESCE(SUM(
          CASE
            WHEN oi.item_type = 'account' THEN a.price
            WHEN oi.item_type = 'key' THEN k.price
            ELSE 0
          END
        ), 0) as total_revenue
      FROM Games g
      LEFT JOIN Platforms p ON g.platform_id = p.id
      LEFT JOIN Accounts a ON g.id = a.game_id
      LEFT JOIN Keys k ON g.id = k.game_id
      LEFT JOIN OrderItems oi ON (
        (oi.item_type = 'account' AND oi.item_id = a.id) OR
        (oi.item_type = 'key' AND oi.item_id = k.id)
      )
      LEFT JOIN Orders o ON oi.order_id = o.id AND o.status = 'completed'
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (start_date) {
      conditions.push(`o.created_at >= $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      conditions.push(`o.created_at <= $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY g.id, g.title, p.name
      ORDER BY total_revenue DESC
      LIMIT $${paramCount}
    `;

    values.push(parseInt(limit));

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sales by game:', err);
    res.status(500).json({ error: 'Не удалось получить статистику продаж по играм' });
  }
});

/**
 * GET /api/statistics/sales-by-period
 * Статистика продаж по периодам (для графиков)
 */
router.get('/sales-by-period', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { start_date, end_date, period = 'day' } = req.query;

    // Определяем формат группировки
    const periodFormats = {
      hour: 'YYYY-MM-DD HH24:00',
      day: 'YYYY-MM-DD',
      week: 'IYYY-IW',
      month: 'YYYY-MM',
      year: 'YYYY'
    };

    const formatString = periodFormats[period] || periodFormats.day;

    let query = `
      SELECT
        TO_CHAR(created_at, '${formatString}') as period,
        COUNT(*) as orders_count,
        COALESCE(SUM(total_price), 0) as total_revenue
      FROM Orders
      WHERE status = 'completed'
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (start_date) {
      conditions.push(`created_at >= $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      conditions.push(`created_at <= $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY period
      ORDER BY period ASC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sales by period:', err);
    res.status(500).json({ error: 'Не удалось получить статистику продаж по периодам' });
  }
});

/**
 * GET /api/statistics/top-users
 * Топ пользователей по количеству покупок
 */
router.get('/top-users', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total_price), 0) as total_spent
      FROM Users u
      LEFT JOIN Orders o ON u.id = o.user_id AND o.status = 'completed'
      GROUP BY u.id, u.username, u.email
      HAVING COUNT(o.id) > 0
      ORDER BY total_spent DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching top users:', err);
    res.status(500).json({ error: 'Не удалось получить топ пользователей' });
  }
});

/**
 * GET /api/statistics/inventory-status
 * Статус инвентаря (доступные/проданные товары)
 */
router.get('/inventory-status', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        g.id as game_id,
        g.title as game_title,
        p.name as platform_name,
        COUNT(a.id) FILTER (WHERE a.status = 'available') as available_accounts,
        COUNT(a.id) FILTER (WHERE a.status = 'sold') as sold_accounts,
        COUNT(k.id) FILTER (WHERE k.status = 'available') as available_keys,
        COUNT(k.id) FILTER (WHERE k.status = 'sold') as sold_keys,
        MIN(a.price) FILTER (WHERE a.status = 'available') as min_account_price,
        MIN(k.price) FILTER (WHERE k.status = 'available') as min_key_price
      FROM Games g
      LEFT JOIN Platforms p ON g.platform_id = p.id
      LEFT JOIN Accounts a ON g.id = a.game_id
      LEFT JOIN Keys k ON g.id = k.game_id
      GROUP BY g.id, g.title, p.name
      ORDER BY g.title ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inventory status:', err);
    res.status(500).json({ error: 'Не удалось получить статус инвентаря' });
  }
});

/**
 * GET /api/statistics/revenue-by-platform
 * Доход по платформам
 */
router.get('/revenue-by-platform', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT
        p.id as platform_id,
        p.name as platform_name,
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(
          CASE
            WHEN oi.item_type = 'account' THEN a.price
            WHEN oi.item_type = 'key' THEN k.price
            ELSE 0
          END
        ), 0) as total_revenue
      FROM Platforms p
      LEFT JOIN Games g ON p.id = g.platform_id
      LEFT JOIN Accounts a ON g.id = a.game_id
      LEFT JOIN Keys k ON g.id = k.game_id
      LEFT JOIN OrderItems oi ON (
        (oi.item_type = 'account' AND oi.item_id = a.id) OR
        (oi.item_type = 'key' AND oi.item_id = k.id)
      )
      LEFT JOIN Orders o ON oi.order_id = o.id AND o.status = 'completed'
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (start_date) {
      conditions.push(`o.created_at >= $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      conditions.push(`o.created_at <= $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching revenue by platform:', err);
    res.status(500).json({ error: 'Не удалось получить доход по платформам' });
  }
});

/**
 * GET /api/statistics/user-activity
 * Активность пользователей (регистрации по периодам)
 */
router.get('/user-activity', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { start_date, end_date, period = 'day' } = req.query;

    const periodFormats = {
      day: 'YYYY-MM-DD',
      week: 'IYYY-IW',
      month: 'YYYY-MM',
      year: 'YYYY'
    };

    const formatString = periodFormats[period] || periodFormats.day;

    let query = `
      SELECT
        TO_CHAR(created_at, '${formatString}') as period,
        COUNT(*) as new_users
      FROM Users
      WHERE 1=1
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (start_date) {
      conditions.push(`created_at >= $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      conditions.push(`created_at <= $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY period
      ORDER BY period ASC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user activity:', err);
    res.status(500).json({ error: 'Не удалось получить активность пользователей' });
  }
});

module.exports = router;
