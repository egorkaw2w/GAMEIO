// api/src/routes/settings.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/settings
 * Получить настройки текущего пользователя
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, theme, date_format, page_size FROM UserSettings WHERE user_id = $1',
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      // Если настроек нет, создаём с дефолтными значениями
      const createResult = await pool.query(
        `INSERT INTO UserSettings (user_id, theme, date_format, page_size)
         VALUES ($1, 'light', 'YYYY-MM-DD', 10)
         RETURNING id, user_id, theme, date_format, page_size`,
        [req.user.user_id]
      );
      return res.json(createResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user settings:', err);
    res.status(500).json({ error: 'Не удалось получить настройки пользователя' });
  }
});

/**
 * PUT /api/settings
 * Обновить настройки текущего пользователя
 */
router.put('/', verifyToken, async (req, res) => {
  const { theme, date_format, page_size } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (theme) {
      if (!['light', 'dark'].includes(theme)) {
        return res.status(400).json({ error: 'Тема должна быть "light" или "dark"' });
      }
      updates.push(`theme = $${paramCount}`);
      values.push(theme);
      paramCount++;
    }

    if (date_format) {
      updates.push(`date_format = $${paramCount}`);
      values.push(date_format);
      paramCount++;
    }

    if (page_size !== undefined) {
      const pageSizeNum = parseInt(page_size);
      if (isNaN(pageSizeNum) || pageSizeNum <= 0) {
        return res.status(400).json({ error: 'page_size должен быть положительным числом' });
      }
      updates.push(`page_size = $${paramCount}`);
      values.push(pageSizeNum);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(req.user.user_id);

    const query = `
      UPDATE UserSettings
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING id, user_id, theme, date_format, page_size
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      // Если настроек не было, создаём новые
      const createResult = await pool.query(
        `INSERT INTO UserSettings (user_id, theme, date_format, page_size)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, theme, date_format, page_size`,
        [
          req.user.user_id,
          theme || 'light',
          date_format || 'YYYY-MM-DD',
          page_size || 10
        ]
      );
      return res.json(createResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user settings:', err);
    res.status(500).json({ error: 'Не удалось обновить настройки пользователя' });
  }
});

/**
 * DELETE /api/settings
 * Сбросить настройки пользователя к дефолтным значениям
 */
router.delete('/', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM UserSettings WHERE user_id = $1', [req.user.user_id]);

    // Создаём настройки с дефолтными значениями
    const result = await pool.query(
      `INSERT INTO UserSettings (user_id, theme, date_format, page_size)
       VALUES ($1, 'light', 'YYYY-MM-DD', 10)
       RETURNING id, user_id, theme, date_format, page_size`,
      [req.user.user_id]
    );

    res.json({
      message: 'Настройки сброшены к значениям по умолчанию',
      settings: result.rows[0]
    });
  } catch (err) {
    console.error('Error resetting user settings:', err);
    res.status(500).json({ error: 'Не удалось сбросить настройки пользователя' });
  }
});

module.exports = router;
