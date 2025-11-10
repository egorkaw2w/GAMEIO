-- db/triggers.sql (FINAL)

DROP TRIGGER IF EXISTS trg_audit_accounts ON Accounts;
DROP TRIGGER IF EXISTS trg_update_order_total ON OrderItems;

-- Триггер: аудит
CREATE OR REPLACE FUNCTION trigger_audit_accounts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM log_audit(
            NULL::INTEGER,
            TG_OP::TEXT,           -- Приведение к TEXT
            TG_TABLE_NAME,         -- TYPE NAME
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit(
            NULL::INTEGER,
            TG_OP::TEXT,
            TG_TABLE_NAME,
            to_jsonb(OLD),
            NULL
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_accounts
    AFTER UPDATE OR DELETE ON Accounts
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_accounts();

-- Триггер: total_price
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
DECLARE
    total DECIMAL(10,2);
    order_id_val INTEGER;
BEGIN
    order_id_val := COALESCE(NEW.order_id, OLD.order_id);

    SELECT SUM(oi.quantity * 
        CASE WHEN oi.item_type = 'account' THEN a.price ELSE k.price END
    ) INTO total
    FROM OrderItems oi
    LEFT JOIN Accounts a ON oi.item_type = 'account' AND oi.item_id = a.id
    LEFT JOIN Keys k ON oi.item_type = 'key' AND oi.item_id = k.id
    WHERE oi.order_id = order_id_val;

    UPDATE Orders 
    SET total_price = COALESCE(total, 0) 
    WHERE id = order_id_val;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_total
    AFTER INSERT OR UPDATE OR DELETE ON OrderItems
    FOR EACH ROW EXECUTE FUNCTION update_order_total();
    -- ДОБАВИТЬ В triggers.sql (в конец)

-- ТРИГГЕР 3: Запретить удаление проданных товаров
CREATE OR REPLACE FUNCTION prevent_sold_item_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'sold' THEN
        RAISE EXCEPTION 'Cannot delete sold item (id=%)', OLD.id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_sold_account_delete
    BEFORE DELETE ON Accounts
    FOR EACH ROW EXECUTE FUNCTION prevent_sold_item_delete();

CREATE TRIGGER trg_prevent_sold_key_delete
    BEFORE DELETE ON Keys
    FOR EACH ROW EXECUTE FUNCTION prevent_sold_item_delete();