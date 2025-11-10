-- db/procedures.sql (FINAL — 100% РАБОЧИЙ)

-- 1. create_order_with_items
CREATE OR REPLACE PROCEDURE create_order_with_items(
    p_user_id INTEGER,
    p_items JSONB
)
LANGUAGE plpgsql AS $$
DECLARE
    item JSONB;
    total DECIMAL(10,2) := 0;
    order_id INTEGER;
    item_price DECIMAL(10,2);
BEGIN
    INSERT INTO Orders (user_id, total_price, status)
    VALUES (p_user_id, 0, 'pending')
    RETURNING id INTO order_id;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF (item->>'type') = 'account' THEN
            SELECT price INTO item_price FROM Accounts WHERE id = (item->>'id')::INTEGER AND status = 'available';
            IF item_price IS NULL THEN
                RAISE EXCEPTION 'Account % not available', (item->>'id');
            END IF;
            UPDATE Accounts SET status = 'sold' WHERE id = (item->>'id')::INTEGER;
        ELSIF (item->>'type') = 'key' THEN
            SELECT price INTO item_price FROM Keys WHERE id = (item->>'id')::INTEGER AND status = 'available';
            IF item_price IS NULL THEN
                RAISE EXCEPTION 'Key % not available', (item->>'id');
            END IF;
            UPDATE Keys SET status = 'sold' WHERE id = (item->>'id')::INTEGER;
        END IF;

        total := total + item_price * (item->>'qty')::INTEGER;

        INSERT INTO OrderItems (order_id, item_type, item_id, quantity)
        VALUES (order_id, item->>'type', (item->>'id')::INTEGER, (item->>'qty')::INTEGER);
    END LOOP;

    UPDATE Orders SET total_price = total, status = 'completed' WHERE id = order_id;

    RAISE NOTICE 'Order % created with total %', order_id, total;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
$$;

-- 2. get_revenue_by_platform
CREATE OR REPLACE FUNCTION get_revenue_by_platform(p_platform_id INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    revenue DECIMAL(10,2);
BEGIN
    SELECT SUM(oi.quantity * 
        CASE WHEN oi.item_type = 'account' THEN a.price ELSE k.price END
    ) INTO revenue
    FROM OrderItems oi
    JOIN Orders o ON oi.order_id = o.id
    LEFT JOIN Accounts a ON oi.item_type = 'account' AND oi.item_id = a.id
    LEFT JOIN Keys k ON oi.item_type = 'key' AND oi.item_id = k.id
    JOIN Games g ON (a.game_id = g.id OR k.game_id = g.id)
    WHERE g.platform_id = p_platform_id AND o.status = 'completed';

    RETURN COALESCE(revenue, 0);
END;
$$ LANGUAGE plpgsql;

-- 3. log_audit — С NAME, НЕ VARCHAR!
CREATE OR REPLACE FUNCTION log_audit(
    p_user_id INTEGER,
    p_action TEXT,
    p_table NAME,
    p_old JSONB DEFAULT NULL,
    p_new JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO AuditLog (user_id, action, table_name, old_value, new_value)
    VALUES (p_user_id, p_action, p_table, p_old::TEXT, p_new::TEXT);
END;
$$ LANGUAGE plpgsql;
-- ДОБАВИТЬ В procedures.sql (в конец)

-- ПРОЦЕДУРА 2: Пакетное обновление цен (на 10%)
CREATE OR REPLACE PROCEDURE increase_prices_by_percent(p_percent DECIMAL)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE Accounts SET price = price * (1 + p_percent / 100) WHERE status = 'available';
    UPDATE Keys SET price = price * (1 + p_percent / 100) WHERE status = 'available';
    RAISE NOTICE 'Prices increased by %%%', p_percent;
END;
$$;

-- ПРОЦЕДУРА 3: Удалить неактивных пользователей (без заказов)
CREATE OR REPLACE PROCEDURE cleanup_inactive_users()
LANGUAGE plpgsql AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM Users
        WHERE id NOT IN (SELECT user_id FROM Orders WHERE user_id IS NOT NULL)
          AND id NOT IN (SELECT user_id FROM UserRoles WHERE user_id IS NOT NULL)
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RAISE NOTICE 'Deleted % inactive users', deleted_count;
END;
$$;