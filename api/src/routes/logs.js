// api/src/routes/logs.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/logs
 * Получить список логов с фильтрацией и пагинацией
 */
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      table_name,
      user_id,
      date_from,
      date_to,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    // Фильтр по действию
    if (action) {
      params.push(action);
      conditions.push(`al.action = $${params.length}`);
    }

    // Фильтр по таблице
    if (table_name) {
      params.push(table_name);
      conditions.push(`al.table_name = $${params.length}`);
    }

    // Фильтр по пользователю
    if (user_id) {
      params.push(parseInt(user_id));
      conditions.push(`al.user_id = $${params.length}`);
    }

    // Фильтр по дате (от)
    if (date_from) {
      params.push(date_from);
      conditions.push(`al.timestamp >= $${params.length}::timestamp`);
    }

    // Фильтр по дате (до)
    if (date_to) {
      params.push(date_to + ' 23:59:59');
      conditions.push(`al.timestamp <= $${params.length}::timestamp`);
    }

    // Поиск по тексту (в old_value, new_value)
    if (search) {
      params.push(`%${search}%`);
      const searchParam = params.length;
      conditions.push(`(
        al.old_value ILIKE $${searchParam} OR
        al.new_value ILIKE $${searchParam} OR
        al.action ILIKE $${searchParam} OR
        al.table_name ILIKE $${searchParam} OR
        u.username ILIKE $${searchParam}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Получаем общее количество
    const countQuery = `
      SELECT COUNT(*) as total
      FROM AuditLog al
      LEFT JOIN Users u ON al.user_id = u.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Получаем логи с пагинацией
    params.push(parseInt(limit));
    params.push(offset);

    const logsQuery = `
      SELECT
        al.id,
        al.user_id,
        u.username,
        u.email,
        COALESCE(
          (SELECT r.name FROM UserRoles ur
           JOIN Roles r ON ur.role_id = r.id
           WHERE ur.user_id = u.id
           LIMIT 1),
          'user'
        ) as user_role,
        al.action,
        al.table_name,
        al.old_value,
        al.new_value,
        al.timestamp
      FROM AuditLog al
      LEFT JOIN Users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const logsResult = await pool.query(logsQuery, params);

    res.json({
      logs: logsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Не удалось получить логи' });
  }
});

/**
 * GET /api/logs/actions
 * Получить список уникальных действий
 */
router.get('/actions', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT action FROM AuditLog ORDER BY action
    `);
    res.json({ actions: result.rows.map(r => r.action) });
  } catch (err) {
    console.error('Error fetching actions:', err);
    res.status(500).json({ error: 'Не удалось получить список действий' });
  }
});

/**
 * GET /api/logs/tables
 * Получить список уникальных таблиц
 */
router.get('/tables', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT table_name FROM AuditLog ORDER BY table_name
    `);
    res.json({ tables: result.rows.map(r => r.table_name) });
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).json({ error: 'Не удалось получить список таблиц' });
  }
});

/**
 * GET /api/logs/users
 * Получить список пользователей с логами
 */
router.get('/users', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT u.id, u.username, u.email
      FROM AuditLog al
      JOIN Users u ON al.user_id = u.id
      ORDER BY u.username
    `);
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Не удалось получить список пользователей' });
  }
});

/**
 * GET /api/logs/stats
 * Получить статистику по логам
 */
router.get('/stats', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    // Общее количество логов
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM AuditLog');

    // Логов за последние 24 часа
    const last24hResult = await pool.query(`
      SELECT COUNT(*) as total FROM AuditLog
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `);

    // Логов за последние 7 дней
    const last7dResult = await pool.query(`
      SELECT COUNT(*) as total FROM AuditLog
      WHERE timestamp > NOW() - INTERVAL '7 days'
    `);

    // Топ действий
    const topActionsResult = await pool.query(`
      SELECT action, COUNT(*) as count
      FROM AuditLog
      GROUP BY action
      ORDER BY count DESC
      LIMIT 5
    `);

    // Активность по дням (последние 7 дней)
    const activityResult = await pool.query(`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM AuditLog
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date
    `);

    res.json({
      total: parseInt(totalResult.rows[0].total),
      last24h: parseInt(last24hResult.rows[0].total),
      last7d: parseInt(last7dResult.rows[0].total),
      topActions: topActionsResult.rows,
      activityByDay: activityResult.rows
    });
  } catch (err) {
    console.error('Error fetching log stats:', err);
    res.status(500).json({ error: 'Не удалось получить статистику логов' });
  }
});

/**
 * DELETE /api/logs/clear
 * Очистить старые логи (старше 30 дней)
 */
router.delete('/clear', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await pool.query(`
      DELETE FROM AuditLog
      WHERE timestamp < NOW() - INTERVAL '${parseInt(days)} days'
      RETURNING id
    `);

    res.json({
      message: `Удалено ${result.rowCount} записей старше ${days} дней`,
      deleted: result.rowCount
    });
  } catch (err) {
    console.error('Error clearing logs:', err);
    res.status(500).json({ error: 'Не удалось очистить логи' });
  }
});

/**
 * Вспомогательная функция для логирования действий
 * Можно использовать в других роутах
 */
const logAction = async (userId, action, tableName, oldValue = null, newValue = null) => {
  try {
    await pool.query(
      `INSERT INTO AuditLog (user_id, action, table_name, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, tableName,
       oldValue ? JSON.stringify(oldValue) : null,
       newValue ? JSON.stringify(newValue) : null]
    );
  } catch (err) {
    console.error('Error logging action:', err);
  }
};

module.exports = router;
module.exports.logAction = logAction;
