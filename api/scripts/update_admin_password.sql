-- Обновление пароля админа
-- Email: admin@example.com
-- Новый пароль: admin123

UPDATE Users
SET password_hash = '$2a$10$C0gkPVS99ZJPjK78FeN4WuuPKccLPXy.PiYNbaL7IR.09s8CuMj02'
WHERE email = 'admin@example.com';

-- Проверяем результат
SELECT id, username, email FROM Users WHERE email = 'admin@example.com';
