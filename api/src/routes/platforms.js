// api/src/routes/platforms.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validatePlatformCreation, validateIdParam } = require('../middleware/validation');

/**
 * GET /api/platforms
 * Получить список всех платформ
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.created_at,
        COUNT(g.id) as games_count
      FROM Platforms p
      LEFT JOIN Games g ON p.id = g.platform_id
      GROUP BY p.id, p.name, p.description, p.created_at
      ORDER BY p.name ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching platforms:', err);
    res.status(500).json({ error: 'Не удалось получить список платформ' });
  }
});

/**
 * GET /api/platforms/:id
 * Получить информацию о платформе по ID
 */
router.get('/:id', validateIdParam('id'), async (req, res) => {
  const platformId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.created_at,
        COUNT(g.id) as games_count
      FROM Platforms p
      LEFT JOIN Games g ON p.id = g.platform_id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.description, p.created_at
    `, [platformId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Платформа не найдена' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching platform:', err);
    res.status(500).json({ error: 'Не удалось получить информацию о платформе' });
  }
});

/**
 * POST /api/platforms
 * Создать новую платформу (только для админов и менеджеров)
 */
router.post('/', verifyToken, requireRole(['admin', 'manager']), validatePlatformCreation, async (req, res) => {
  const { name, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO Platforms (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, created_at`,
      [name, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating platform:', err);
    if (err.code === '23505') { // Уникальное ограничение
      return res.status(400).json({ error: 'Платформа с таким названием уже существует' });
    }
    res.status(500).json({ error: 'Не удалось создать платформу' });
  }
});

/**
 * PUT /api/platforms/:id
 * Обновить информацию о платформе (только для админов и менеджеров)
 */
router.put('/:id', verifyToken, requireRole(['admin', 'manager']), validateIdParam('id'), async (req, res) => {
  const platformId = req.params.id;
  const { name, description } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
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

    values.push(platformId);

    const query = `
      UPDATE Platforms
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, created_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Платформа не найдена' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating platform:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Платформа с таким названием уже существует' });
    }
    res.status(500).json({ error: 'Не удалось обновить платформу' });
  }
});

/**
 * DELETE /api/platforms/:id
 * Удалить платформу (только для админов)
 */
router.delete('/:id', verifyToken, requireRole(['admin']), validateIdParam('id'), async (req, res) => {
  const platformId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM Platforms WHERE id = $1 RETURNING id', [platformId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Платформа не найдена' });
    }

    res.json({ message: 'Платформа успешно удалена', id: platformId });
  } catch (err) {
    console.error('Error deleting platform:', err);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Невозможно удалить платформу, так как с ней связаны игры' });
    }
    res.status(500).json({ error: 'Не удалось удалить платформу' });
  }
});

/**
 * GET /api/platforms/:id/games
 * Получить список игр для конкретной платформы
 */
router.get('/:id/games', validateIdParam('id'), async (req, res) => {
  const platformId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT
        g.id,
        g.title,
        g.description,
        g.created_at,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'available') as available_accounts,
        COUNT(DISTINCT k.id) FILTER (WHERE k.status = 'available') as available_keys
      FROM Games g
      LEFT JOIN Accounts a ON g.id = a.game_id
      LEFT JOIN Keys k ON g.id = k.game_id
      WHERE g.platform_id = $1
      GROUP BY g.id, g.title, g.description, g.created_at
      ORDER BY g.title ASC
    `, [platformId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching platform games:', err);
    res.status(500).json({ error: 'Не удалось получить список игр платформы' });
  }
});

module.exports = router;
