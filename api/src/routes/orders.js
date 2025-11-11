// api/src/routes/orders.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db'); // ← ОК
const { verifyToken } = require('../middleware/auth');

// Создать заказ
router.post('/', verifyToken, async (req, res) => {
  const { items } = req.body; // [{ game_id: 1, platform_id: 1 }]
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderRes = await client.query(
      `INSERT INTO Orders (user_id, total_amount, status)
       VALUES ($1, 0, 'pending') RETURNING order_id`,
      [req.user.user_id]
    );
    const orderId = orderRes.rows[0].order_id;
    let total = 0;

    for (const item of items) {
      const gameRes = await client.query(
        `SELECT price FROM Games WHERE game_id = $1`, [item.game_id]
      );
      const price = gameRes.rows[0].price;
      total += price;

      await client.query(
        `INSERT INTO OrderItems (order_id, game_id, platform_id, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.game_id, item.platform_id, price]
      );
    }

    await client.query(
      `UPDATE Orders SET total_amount = $1, status = 'completed' WHERE order_id = $2`,
      [total, orderId]
    );

    await client.query('COMMIT');
    res.json({ order_id: orderId, total, status: 'completed' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;