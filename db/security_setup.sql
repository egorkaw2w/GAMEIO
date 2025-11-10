-- db/security_setup.sql

-- Включить pgcrypto (шифрование)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Функция: шифрование данных (используем ключ из .env)
CREATE OR REPLACE FUNCTION encrypt_field(plain_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(pgp_sym_encrypt(plain_text, current_setting('app.encryption_key')), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Функция: расшифровка
CREATE OR REPLACE FUNCTION decrypt_field(encrypted_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql;

-- Установить ключ шифрования (из .env)
SET app.encryption_key = 'your_32_char_encryption_key_here1234';

-- Роли в БД (RBAC на уровне PostgreSQL)
CREATE ROLE admin_role NOLOGIN;
CREATE ROLE user_role NOLOGIN;
CREATE ROLE guest_role NOLOGIN;

-- Права для admin_role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin_role;

-- Права для user_role
GRANT SELECT, INSERT, UPDATE ON Orders, OrderItems, Payments TO user_role;
GRANT SELECT ON Games, Accounts, Keys, Platforms TO user_role;
GRANT SELECT, UPDATE ON UserSettings, Users TO user_role;

-- Права для guest_role
GRANT SELECT ON Games, Platforms TO guest_role;

-- Назначить роли пользователям (пример)
-- ALTER ROLE postgres WITH LOGIN; -- если нужно
-- GRANT admin_role TO postgres;