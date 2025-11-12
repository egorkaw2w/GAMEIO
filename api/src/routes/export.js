// api/src/routes/export.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * Вспомогательная функция для конвертации данных в CSV
 */
const convertToCSV = (data) => {
  if (data.length === 0) return '';

  // Получаем заголовки из первого объекта
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  // Формируем строки данных
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Экранируем запятые и кавычки
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Вспомогательная функция для парсинга CSV
 */
const parseCSV = (csvString) => {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV файл пустой или содержит только заголовки');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });
    data.push(row);
  }

  return data;
};

/**
 * GET /api/export/users
 * Экспорт пользователей в CSV
 */
router.get('/users', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.created_at,
        STRING_AGG(r.name, '; ') as roles
      FROM Users u
      LEFT JOIN UserRoles ur ON u.id = ur.user_id
      LEFT JOIN Roles r ON ur.role_id = r.id
      GROUP BY u.id, u.username, u.email, u.created_at
      ORDER BY u.id
    `);

    const csv = convertToCSV(result.rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting users:', err);
    res.status(500).json({ error: 'Не удалось экспортировать пользователей' });
  }
});

/**
 * GET /api/export/games
 * Экспорт игр в CSV
 */
router.get('/games', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        g.id,
        g.title,
        p.name as platform,
        g.description,
        g.created_at
      FROM Games g
      LEFT JOIN Platforms p ON g.platform_id = p.id
      ORDER BY g.id
    `);

    const csv = convertToCSV(result.rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=games.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting games:', err);
    res.status(500).json({ error: 'Не удалось экспортировать игры' });
  }
});

/**
 * GET /api/export/orders
 * Экспорт заказов в CSV
 */
router.get('/orders', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT
        o.id,
        u.username,
        u.email,
        o.total_price,
        o.status,
        o.created_at
      FROM Orders o
      LEFT JOIN Users u ON o.user_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND o.created_at >= $${paramCount}`;
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND o.created_at <= $${paramCount}`;
      values.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY o.id';

    const result = await pool.query(query, values);
    const csv = convertToCSV(result.rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting orders:', err);
    res.status(500).json({ error: 'Не удалось экспортировать заказы' });
  }
});

/**
 * GET /api/export/inventory
 * Экспорт инвентаря в CSV
 */
router.get('/inventory', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const accountsResult = await pool.query(`
      SELECT
        'account' as type,
        a.id,
        g.title as game_title,
        a.login,
        a.price,
        a.status
      FROM Accounts a
      LEFT JOIN Games g ON a.game_id = g.id
      ORDER BY a.id
    `);

    const keysResult = await pool.query(`
      SELECT
        'key' as type,
        k.id,
        g.title as game_title,
        '' as login,
        k.price,
        k.status
      FROM Keys k
      LEFT JOIN Games g ON k.game_id = g.id
      ORDER BY k.id
    `);

    const allInventory = [...accountsResult.rows, ...keysResult.rows];
    const csv = convertToCSV(allInventory);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting inventory:', err);
    res.status(500).json({ error: 'Не удалось экспортировать инвентарь' });
  }
});

/**
 * GET /api/export/statistics
 * Экспорт статистики в CSV
 */
router.get('/statistics', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        g.id as game_id,
        g.title as game_title,
        p.name as platform_name,
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(
          CASE
            WHEN oi.item_type = 'account' THEN a.price
            WHEN oi.item_type = 'key' THEN k.price
            ELSE 0
          END
        ), 0) as total_revenue,
        COUNT(a.id) FILTER (WHERE a.status = 'available') as available_accounts,
        COUNT(k.id) FILTER (WHERE k.status = 'available') as available_keys
      FROM Games g
      LEFT JOIN Platforms p ON g.platform_id = p.id
      LEFT JOIN Accounts a ON g.id = a.game_id
      LEFT JOIN Keys k ON g.id = k.game_id
      LEFT JOIN OrderItems oi ON (
        (oi.item_type = 'account' AND oi.item_id = a.id) OR
        (oi.item_type = 'key' AND oi.item_id = k.id)
      )
      LEFT JOIN Orders o ON oi.order_id = o.id AND o.status = 'completed'
      GROUP BY g.id, g.title, p.name
      ORDER BY total_revenue DESC
    `);

    const csv = convertToCSV(result.rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=statistics.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting statistics:', err);
    res.status(500).json({ error: 'Не удалось экспортировать статистику' });
  }
});

/**
 * POST /api/export/import-games
 * Импорт игр из CSV
 */
router.post('/import-games', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { csv_data } = req.body;

    if (!csv_data) {
      return res.status(400).json({ error: 'CSV данные отсутствуют' });
    }

    const games = parseCSV(csv_data);
    const imported = [];
    const errors = [];

    for (const game of games) {
      try {
        // Найдем platform_id по имени платформы
        const platformRes = await pool.query(
          'SELECT id FROM Platforms WHERE name = $1',
          [game.platform]
        );

        if (platformRes.rows.length === 0) {
          errors.push(`Платформа "${game.platform}" не найдена для игры "${game.title}"`);
          continue;
        }

        const platformId = platformRes.rows[0].id;

        const result = await pool.query(
          `INSERT INTO Games (title, platform_id, description)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [game.title, platformId, game.description || null]
        );

        if (result.rows.length > 0) {
          imported.push(game.title);
        }
      } catch (err) {
        errors.push(`Ошибка при импорте игры "${game.title}": ${err.message}`);
      }
    }

    res.json({
      message: 'Импорт завершён',
      imported_count: imported.length,
      error_count: errors.length,
      imported,
      errors
    });
  } catch (err) {
    console.error('Error importing games:', err);
    res.status(500).json({ error: 'Не удалось импортировать игры' });
  }
});

module.exports = router;
