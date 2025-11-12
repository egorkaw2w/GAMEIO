// api/src/routes/games.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateGameCreation, validateIdParam } = require('../middleware/validation');

/**
 * GET /api/games
 * Получить список всех игр
 */
router.get('/', async (req, res) => {
  try {
    const { platform_id, search } = req.query;
    let query = `
      SELECT
        g.id,
        g.title,
        g.description,
        g.platform_id,
        p.name as platform_name,
        g.created_at,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'available') as available_accounts,
        COUNT(DISTINCT k.id) FILTER (WHERE k.status = 'available') as available_keys
      FROM Games g
      LEFT JOIN Platforms p ON g.platform_id = p.id
      LEFT JOIN Accounts a ON g.id = a.game_id
      LEFT JOIN Keys k ON g.id = k.game_id
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (platform_id) {
      conditions.push(`g.platform_id = $${paramCount}`);
      values.push(platform_id);
      paramCount++;
    }

    if (search) {
      conditions.push(`g.title ILIKE $${paramCount}`);
      values.push(`%${search}%`);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY g.id, g.title, g.description, g.platform_id, p.name, g.created_at
      ORDER BY g.title ASC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ error: 'Не удалось получить список игр' });
  }
});

/**
 * GET /api/games/:id
 * Получить информацию об игре по ID
 */
router.get('/:id', validateIdParam('id'), async (req, res) => {
  const gameId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT
        g.id,
        g.title,
        g.description,
        g.platform_id,
        p.name as platform_name,
        g.created_at,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'available') as available_accounts,
        COUNT(DISTINCT k.id) FILTER (WHERE k.status = 'available') as available_keys,
        MIN(a.price) FILTER (WHERE a.status = 'available') as min_account_price,
        MIN(k.price) FILTER (WHERE k.status = 'available') as min_key_price
      FROM Games g
      LEFT JOIN Platforms p ON g.platform_id = p.id
      LEFT JOIN Accounts a ON g.id = a.game_id
      LEFT JOIN Keys k ON g.id = k.game_id
      WHERE g.id = $1
      GROUP BY g.id, g.title, g.description, g.platform_id, p.name, g.created_at
    `, [gameId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Игра не найдена' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching game:', err);
    res.status(500).json({ error: 'Не удалось получить информацию об игре' });
  }
});

/**
 * POST /api/games
 * Создать новую игру (только для админов и менеджеров)
 */
router.post('/', verifyToken, requireRole(['admin', 'manager']), validateGameCreation, async (req, res) => {
  const { title, platform_id, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO Games (title, platform_id, description)
       VALUES ($1, $2, $3)
       RETURNING id, title, platform_id, description, created_at`,
      [title, platform_id, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating game:', err);
    if (err.code === '23503') { // Нарушение внешнего ключа
      return res.status(400).json({ error: 'Платформа с указанным ID не существует' });
    }
    if (err.code === '23505') { // Уникальное ограничение
      return res.status(400).json({ error: 'Игра с таким названием уже существует' });
    }
    res.status(500).json({ error: 'Не удалось создать игру' });
  }
});

/**
 * PUT /api/games/:id
 * Обновить информацию об игре (только для админов и менеджеров)
 */
router.put('/:id', verifyToken, requireRole(['admin', 'manager']), validateIdParam('id'), async (req, res) => {
  const gameId = req.params.id;
  const { title, platform_id, description } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }

    if (platform_id) {
      updates.push(`platform_id = $${paramCount}`);
      values.push(platform_id);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(gameId);

    const query = `
      UPDATE Games
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, platform_id, description, created_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Игра не найдена' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating game:', err);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Платформа с указанным ID не существует' });
    }
    res.status(500).json({ error: 'Не удалось обновить игру' });
  }
});

/**
 * DELETE /api/games/:id
 * Удалить игру (только для админов)
 */
router.delete('/:id', verifyToken, requireRole(['admin']), validateIdParam('id'), async (req, res) => {
  const gameId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM Games WHERE id = $1 RETURNING id', [gameId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Игра не найдена' });
    }

    res.json({ message: 'Игра успешно удалена', id: gameId });
  } catch (err) {
    console.error('Error deleting game:', err);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Невозможно удалить игру, так как с ней связаны другие записи' });
    }
    res.status(500).json({ error: 'Не удалось удалить игру' });
  }
});

module.exports = router;
