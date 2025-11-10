-- db/views.sql

-- VIEW 1: Продажи по играм (отчёт для админа)
CREATE OR REPLACE VIEW v_game_sales AS
SELECT
    p.name AS platform,
    g.title AS game,
    COUNT(DISTINCT a.id) + COUNT(DISTINCT k.id) AS total_items,
    SUM(oi.quantity * COALESCE(a.price, k.price)) AS revenue
FROM Platforms p
JOIN Games g ON g.platform_id = p.id
LEFT JOIN Accounts a ON a.game_id = g.id AND a.status = 'sold'
LEFT JOIN Keys k ON k.game_id = g.id AND k.status = 'sold'
LEFT JOIN OrderItems oi ON (oi.item_type = 'account' AND oi.item_id = a.id)
                        OR (oi.item_type = 'key' AND oi.item_id = k.id)
GROUP BY p.name, g.title
ORDER BY revenue DESC;

-- VIEW 2: Активные пользователи (последние 30 дней)
CREATE OR REPLACE VIEW v_active_users AS
SELECT
    u.id,
    u.username,
    u.email,
    COUNT(o.id) AS orders_count,
    SUM(o.total_price) AS total_spent,
    MAX(o.created_at) AS last_order
FROM Users u
LEFT JOIN Orders o ON o.user_id = u.id AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC;

-- VIEW 3: Товары на складе (доступные)
CREATE OR REPLACE VIEW v_available_inventory AS
SELECT
    'account' AS item_type,
    a.id,
    g.title,
    p.name AS platform,
    a.login,
    a.price
FROM Accounts a
JOIN Games g ON a.game_id = g.id
JOIN Platforms p ON g.platform_id = p.id
WHERE a.status = 'available'

UNION ALL

SELECT
    'key' AS item_type,
    k.id,
    g.title,
    p.name AS platform,
    k.key_code_encrypted AS login,
    k.price
FROM Keys k
JOIN Games g ON k.game_id = g.id
JOIN Platforms p ON g.platform_id = p.id
WHERE k.status = 'available'
ORDER BY platform, title;