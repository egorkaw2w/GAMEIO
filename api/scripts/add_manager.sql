-- Создание пользователя-менеджера
-- Логин: manager
-- Пароль: manager123
-- Email: manager@gameio.dev

-- Добавляем пользователя
INSERT INTO Users (username, email, password_hash)
VALUES ('manager', 'manager@gameio.dev', '$2a$10$2doTv5gxGUrfgdrD4.w6dO0IR/KjcJyxw6FqucLW44aX4OXoMub.G')
ON CONFLICT (email) DO NOTHING;

-- Получаем ID менеджера
DO $$
DECLARE
    manager_user_id INT;
    manager_role_id INT;
BEGIN
    SELECT id INTO manager_user_id FROM Users WHERE email = 'manager@gameio.dev';
    SELECT id INTO manager_role_id FROM Roles WHERE name = 'manager';

    -- Присваиваем роль менеджера
    INSERT INTO UserRoles (user_id, role_id)
    VALUES (manager_user_id, manager_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;

-- Проверяем результат
SELECT u.id, u.username, u.email, r.name as role
FROM Users u
JOIN UserRoles ur ON u.id = ur.user_id
JOIN Roles r ON ur.role_id = r.id
WHERE u.email = 'manager@gameio.dev';
