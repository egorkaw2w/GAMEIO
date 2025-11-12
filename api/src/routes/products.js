// api/src/routes/products.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const mapProductRow = (row) => {
  const availability = {
    accounts: Number(row.accounts_available ?? 0),
    keys: Number(row.keys_available ?? 0),
  };

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    platform: row.platform,
    price: Number(row.price ?? 0),
    image: null,
    availability,
    inStock: availability.accounts + availability.keys > 0,
  };
};

const baseSelect = `
  SELECT
    g.id,
    g.title,
    g.description,
    p.name AS platform,
    COALESCE(
      CASE
        WHEN acc.min_price IS NOT NULL AND key_items.min_price IS NOT NULL
          THEN LEAST(acc.min_price, key_items.min_price)
        ELSE NULL
      END,
      acc.min_price,
      key_items.min_price,
      0
    ) AS price,
    COALESCE(acc.available_count, 0) AS accounts_available,
    COALESCE(key_items.available_count, 0) AS keys_available
  FROM Games g
  JOIN Platforms p ON p.id = g.platform_id
  LEFT JOIN (
    SELECT
      game_id,
      MIN(price) FILTER (WHERE status = 'available') AS min_price,
      COUNT(*) FILTER (WHERE status = 'available') AS available_count
    FROM Accounts
    GROUP BY game_id
  ) acc ON acc.game_id = g.id
  LEFT JOIN (
    SELECT
      game_id,
      MIN(price) FILTER (WHERE status = 'available') AS min_price,
      COUNT(*) FILTER (WHERE status = 'available') AS available_count
    FROM Keys
    GROUP BY game_id
  ) key_items ON key_items.game_id = g.id
`;

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      ${baseSelect}
      ORDER BY g.title ASC
    `);
    res.json(rows.map(mapProductRow));
  } catch (error) {
    console.error('Failed to fetch products', error);
    res.status(500).json({ error: 'Не удалось получить список товаров' });
  }
});

router.get('/:id', async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId)) {
    return res.status(400).json({ error: 'Некорректный идентификатор товара' });
  }

  try {
    const { rows } = await pool.query(
      `
        ${baseSelect}
        WHERE g.id = $1
      `,
      [productId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json(mapProductRow(rows[0]));
  } catch (error) {
    console.error(`Failed to fetch product ${productId}`, error);
    res.status(500).json({ error: 'Не удалось получить информацию о товаре' });
  }
});

module.exports = router;

