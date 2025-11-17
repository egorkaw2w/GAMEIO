// api/src/routes/inventory.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateAccountCreation, validateKeyCreation, validateIdParam } = require('../middleware/validation');

// ============= ACCOUNTS =============

/**
 * GET /api/inventory/accounts
 * Получить список всех аккаунтов (только для админов и менеджеров)
 */
router.get('/accounts', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { game_id, status } = req.query;
    let query = `
      SELECT
        a.id,
        a.game_id,
        g.title as game_title,
        a.login,
        a.price,
        a.status
      FROM Accounts a
      LEFT JOIN Games g ON a.game_id = g.id
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (game_id) {
      conditions.push(`a.game_id = $${paramCount}`);
      values.push(game_id);
      paramCount++;
    }

    if (status) {
      conditions.push(`a.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.id DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Не удалось получить список аккаунтов' });
  }
});

/**
 * GET /api/inventory/accounts/:id
 * Получить информацию об аккаунте по ID (только для админов и менеджеров)
 */
router.get('/accounts/:id', verifyToken, requireRole(['admin', 'manager']), validateIdParam('id'), async (req, res) => {
  const accountId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.game_id,
        g.title as game_title,
        a.login,
        a.password_encrypted,
        a.price,
        a.status
      FROM Accounts a
      LEFT JOIN Games g ON a.game_id = g.id
      WHERE a.id = $1
    `, [accountId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Аккаунт не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching account:', err);
    res.status(500).json({ error: 'Не удалось получить информацию об аккаунте' });
  }
});

/**
 * POST /api/inventory/accounts
 * Создать новый аккаунт (только для админов и менеджеров)
 */
router.post('/accounts', verifyToken, requireRole(['admin', 'manager']), validateAccountCreation, async (req, res) => {
  const { game_id, login, password, price } = req.body;

  try {
    // Шифруем пароль с помощью функции БД
    const result = await pool.query(
      `INSERT INTO Accounts (game_id, login, password_encrypted, price, status)
       VALUES ($1, $2, pgp_sym_encrypt($3, current_setting('app.encryption_key')), $4, 'available')
       RETURNING id, game_id, login, price, status`,
      [game_id, login, password, price]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating account:', err);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Игра с указанным ID не существует' });
    }
    res.status(500).json({ error: 'Не удалось создать аккаунт' });
  }
});

/**
 * PUT /api/inventory/accounts/:id
 * Обновить информацию об аккаунте (только для админов и менеджеров)
 */
router.put('/accounts/:id', verifyToken, requireRole(['admin', 'manager']), validateIdParam('id'), async (req, res) => {
  const accountId = req.params.id;
  const { login, password, price, status } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (login) {
      updates.push(`login = $${paramCount}`);
      values.push(login);
      paramCount++;
    }

    if (password) {
      updates.push(`password_encrypted = pgp_sym_encrypt($${paramCount}, current_setting('app.encryption_key'))`);
      values.push(password);
      paramCount++;
    }

    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }

    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(accountId);

    const query = `
      UPDATE Accounts
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, game_id, login, price, status
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Аккаунт не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ error: 'Не удалось обновить аккаунт' });
  }
});

/**
 * DELETE /api/inventory/accounts/:id
 * Удалить аккаунт (только для админов)
 */
router.delete('/accounts/:id', verifyToken, requireRole(['admin']), validateIdParam('id'), async (req, res) => {
  const accountId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM Accounts WHERE id = $1 RETURNING id', [accountId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Аккаунт не найден' });
    }

    res.json({ message: 'Аккаунт успешно удалён', id: accountId });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Не удалось удалить аккаунт' });
  }
});

// ============= KEYS =============

/**
 * GET /api/inventory/keys
 * Получить список всех ключей (только для админов и менеджеров)
 */
router.get('/keys', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { game_id, status } = req.query;
    let query = `
      SELECT
        k.id,
        k.game_id,
        g.title as game_title,
        k.price,
        k.status
      FROM Keys k
      LEFT JOIN Games g ON k.game_id = g.id
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (game_id) {
      conditions.push(`k.game_id = $${paramCount}`);
      values.push(game_id);
      paramCount++;
    }

    if (status) {
      conditions.push(`k.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY k.id DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching keys:', err);
    res.status(500).json({ error: 'Не удалось получить список ключей' });
  }
});

/**
 * GET /api/inventory/keys/:id
 * Получить информацию о ключе по ID (только для админов и менеджеров)
 */
router.get('/keys/:id', verifyToken, requireRole(['admin', 'manager']), validateIdParam('id'), async (req, res) => {
  const keyId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT
        k.id,
        k.game_id,
        g.title as game_title,
        k.key_code_encrypted,
        k.price,
        k.status
      FROM Keys k
      LEFT JOIN Games g ON k.game_id = g.id
      WHERE k.id = $1
    `, [keyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ключ не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching key:', err);
    res.status(500).json({ error: 'Не удалось получить информацию о ключе' });
  }
});

/**
 * POST /api/inventory/keys
 * Создать новый ключ (только для админов и менеджеров)
 */
router.post('/keys', verifyToken, requireRole(['admin', 'manager']), validateKeyCreation, async (req, res) => {
  const { game_id, key_code, price } = req.body;

  try {
    // Шифруем ключ с помощью функции БД
    const result = await pool.query(
      `INSERT INTO Keys (game_id, key_code_encrypted, price, status)
       VALUES ($1, pgp_sym_encrypt($2, current_setting('app.encryption_key')), $3, 'available')
       RETURNING id, game_id, price, status`,
      [game_id, key_code, price]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating key:', err);
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Игра с указанным ID не существует' });
    }
    res.status(500).json({ error: 'Не удалось создать ключ' });
  }
});

/**
 * PUT /api/inventory/keys/:id
 * Обновить информацию о ключе (только для админов и менеджеров)
 */
router.put('/keys/:id', verifyToken, requireRole(['admin', 'manager']), validateIdParam('id'), async (req, res) => {
  const keyId = req.params.id;
  const { key_code, price, status } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (key_code) {
      updates.push(`key_code_encrypted = pgp_sym_encrypt($${paramCount}, current_setting('app.encryption_key'))`);
      values.push(key_code);
      paramCount++;
    }

    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }

    if (status) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(keyId);

    const query = `
      UPDATE Keys
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, game_id, price, status
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ключ не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating key:', err);
    res.status(500).json({ error: 'Не удалось обновить ключ' });
  }
});

/**
 * DELETE /api/inventory/keys/:id
 * Удалить ключ (только для админов)
 */
router.delete('/keys/:id', verifyToken, requireRole(['admin']), validateIdParam('id'), async (req, res) => {
  const keyId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM Keys WHERE id = $1 RETURNING id', [keyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ключ не найден' });
    }

    res.json({ message: 'Ключ успешно удалён', id: keyId });
  } catch (err) {
    console.error('Error deleting key:', err);
    res.status(500).json({ error: 'Не удалось удалить ключ' });
  }
});

module.exports = router;
