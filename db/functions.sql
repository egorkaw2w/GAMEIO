-- db/functions.sql

-- ФУНКЦИЯ 1: Проверить, доступен ли товар
CREATE OR REPLACE FUNCTION is_item_available(
    p_type TEXT,
    p_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    IF p_type = 'account' THEN
        RETURN EXISTS (SELECT 1 FROM Accounts WHERE id = p_id AND status = 'available');
    ELSIF p_type = 'key' THEN
        RETURN EXISTS (SELECT 1 FROM Keys WHERE id = p_id AND status = 'available');
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ФУНКЦИЯ 2: Получить роль пользователя
CREATE OR REPLACE FUNCTION get_user_role(p_user_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    role_name TEXT;
BEGIN
    SELECT r.name INTO role_name
    FROM UserRoles ur
    JOIN Roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    LIMIT 1;

    RETURN COALESCE(role_name, 'guest');
END;
$$ LANGUAGE plpgsql;

-- ФУНКЦИЯ 3: Расшифровать поле (для API)
CREATE OR REPLACE FUNCTION decrypt_field(encrypted_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), current_setting('app.encryption_key'));
EXCEPTION
    WHEN OTHERS THEN RETURN '***ENCRYPTED***';
END;
$$ LANGUAGE plpgsql;