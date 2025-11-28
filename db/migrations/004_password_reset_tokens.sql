-- 004_password_reset_tokens.sql
-- Таблица для хранения токенов восстановления пароля

CREATE TABLE IF NOT EXISTS PasswordResetTokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX idx_password_reset_token ON PasswordResetTokens(token);
CREATE INDEX idx_password_reset_user_id ON PasswordResetTokens(user_id);
CREATE INDEX idx_password_reset_expires_at ON PasswordResetTokens(expires_at);

-- Автоматическое удаление старых токенов (старше 24 часов)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM PasswordResetTokens
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Комментарии
COMMENT ON TABLE PasswordResetTokens IS 'Токены для восстановления пароля';
COMMENT ON COLUMN PasswordResetTokens.token IS 'Уникальный токен для восстановления';
COMMENT ON COLUMN PasswordResetTokens.expires_at IS 'Время истечения токена (15 минут)';
COMMENT ON COLUMN PasswordResetTokens.used IS 'Был ли использован токен';
