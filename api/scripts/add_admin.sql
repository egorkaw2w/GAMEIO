-- Создание пользователя-админа
-- Логин: admin
-- Пароль: admin123
-- Email: admin@gameio.dev

-- Добавляем пользователя
INSERT INTO Users (username, email, password_hash)
VALUES ('admin', 'admin@gameio.dev', '$2a$10$C0gkPVS99ZJPjK78FeN4WuuPKccLPXy.PiYNbaL7IR.09s8CuMj02')
ON CONFLICT (email) DO NOTHING;

-- Получаем ID админа
DO $$
DECLARE
    admin_user_id INT;
    admin_role_id INT;
    manager_role_id INT;
BEGIN
    SELECT id INTO admin_user_id FROM Users WHERE email = 'admin@gameio.dev';
    SELECT id INTO admin_role_id FROM Roles WHERE name = 'admin';
    SELECT id INTO manager_role_id FROM Roles WHERE name = 'manager';

    -- Присваиваем роль админа
    INSERT INTO UserRoles (user_id, role_id)
    VALUES (admin_user_id, admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Также присваиваем роль менеджера (админ может все)
    INSERT INTO UserRoles (user_id, role_id)
    VALUES (admin_user_id, manager_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;

-- Проверяем результат
SELECT u.id, u.username, u.email, string_agg(r.name, ', ') as roles
FROM Users u
JOIN UserRoles ur ON u.id = ur.user_id
JOIN Roles r ON ur.role_id = r.id
WHERE u.email = 'admin@gameio.dev'
GROUP BY u.id, u.username, u.email;
