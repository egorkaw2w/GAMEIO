// api/src/routes/inventory.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateAccountCreation, validateKeyCreation, validateIdParam } = require('../middleware/validation');
const { logAction } = require('./logs');

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
    // Получаем название игры для лога
    const gameRes = await pool.query('SELECT title FROM Games WHERE id = $1', [game_id]);
    const gameTitle = gameRes.rows[0]?.title || 'Неизвестная игра';

    // Сохраняем пароль как есть
    const result = await pool.query(
      `INSERT INTO Accounts (game_id, login, password_encrypted, price, status)
       VALUES ($1, $2, $3, $4, 'available')
       RETURNING id, game_id, login, price, status`,
      [game_id, login, password, price]
    );

    // Логируем добавление аккаунта
    await logAction(req.user.user_id, 'ACCOUNT_ADD', 'Accounts', null, {
      account_id: result.rows[0].id,
      login: login,
      game_title: gameTitle,
      price: price
    });

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
    // Получаем старые данные для лога
    const oldDataRes = await pool.query(`
      SELECT a.login, a.price, a.status, g.title as game_title
      FROM Accounts a
      LEFT JOIN Games g ON a.game_id = g.id
      WHERE a.id = $1
    `, [accountId]);
    const oldData = oldDataRes.rows[0];

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (login) {
      updates.push(`login = $${paramCount}`);
      values.push(login);
      paramCount++;
    }

    if (password) {
      updates.push(`password_encrypted = $${paramCount}`);
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

    // Логируем обновление аккаунта
    await logAction(req.user.user_id, 'ACCOUNT_UPDATE', 'Accounts',
      { login: oldData?.login, price: oldData?.price, status: oldData?.status },
      { account_id: accountId, login: login || oldData?.login, game_title: oldData?.game_title, price: price !== undefined ? price : oldData?.price, status: status || oldData?.status }
    );

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
    // Получаем данные аккаунта для лога перед удалением
    const accountRes = await pool.query(`
      SELECT a.login, a.price, g.title as game_title
      FROM Accounts a
      LEFT JOIN Games g ON a.game_id = g.id
      WHERE a.id = $1
    `, [accountId]);
    const accountData = accountRes.rows[0];

    const result = await pool.query('DELETE FROM Accounts WHERE id = $1 RETURNING id', [accountId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Аккаунт не найден' });
    }

    // Логируем удаление аккаунта
    await logAction(req.user.user_id, 'ACCOUNT_DELETE', 'Accounts',
      { account_id: accountId, login: accountData?.login, game_title: accountData?.game_title, price: accountData?.price },
      null
    );

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
    // Получаем название игры для лога
    const gameRes = await pool.query('SELECT title FROM Games WHERE id = $1', [game_id]);
    const gameTitle = gameRes.rows[0]?.title || 'Неизвестная игра';

    // Сохраняем ключ как есть
    const result = await pool.query(
      `INSERT INTO Keys (game_id, key_code_encrypted, price, status)
       VALUES ($1, $2, $3, 'available')
       RETURNING id, game_id, price, status`,
      [game_id, key_code, price]
    );

    // Логируем добавление ключа (показываем только первые символы ключа)
    const maskedKey = key_code.length > 6 ? key_code.substring(0, 6) + '...' : key_code;
    await logAction(req.user.user_id, 'KEY_ADD', 'Keys', null, {
      key_id: result.rows[0].id,
      key_code: maskedKey,
      game_title: gameTitle,
      price: price
    });

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
    // Получаем старые данные для лога
    const oldDataRes = await pool.query(`
      SELECT k.price, k.status, g.title as game_title
      FROM Keys k
      LEFT JOIN Games g ON k.game_id = g.id
      WHERE k.id = $1
    `, [keyId]);
    const oldData = oldDataRes.rows[0];

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (key_code) {
      updates.push(`key_code_encrypted = $${paramCount}`);
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

    // Логируем обновление ключа
    await logAction(req.user.user_id, 'KEY_UPDATE', 'Keys',
      { price: oldData?.price, status: oldData?.status },
      { key_id: keyId, game_title: oldData?.game_title, price: price !== undefined ? price : oldData?.price, status: status || oldData?.status }
    );

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
    // Получаем данные ключа для лога перед удалением
    const keyRes = await pool.query(`
      SELECT k.price, g.title as game_title
      FROM Keys k
      LEFT JOIN Games g ON k.game_id = g.id
      WHERE k.id = $1
    `, [keyId]);
    const keyData = keyRes.rows[0];

    const result = await pool.query('DELETE FROM Keys WHERE id = $1 RETURNING id', [keyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ключ не найден' });
    }

    // Логируем удаление ключа
    await logAction(req.user.user_id, 'KEY_DELETE', 'Keys',
      { key_id: keyId, game_title: keyData?.game_title, price: keyData?.price },
      null
    );

    res.json({ message: 'Ключ успешно удалён', id: keyId });
  } catch (err) {
    console.error('Error deleting key:', err);
    res.status(500).json({ error: 'Не удалось удалить ключ' });
  }
});

module.exports = router;
