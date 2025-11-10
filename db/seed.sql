-- db/seed.sql (версия 2.0)

-- Platforms (реальные платформы для ключей/аккаунтов)
INSERT INTO Platforms (name, description) VALUES
('Steam', 'Valve Steam Platform'),
('EA App', 'Electronic Arts (ex-Origin)'),
('Epic Games', 'Epic Games Store'),
('Battle.net', 'Blizzard Battle.net'),
('Xbox', 'Microsoft Xbox'),
('PlayStation', 'Sony PlayStation Network'),
('GOG', 'GOG.com DRM-Free'),
('Ubisoft Connect', 'Ubisoft Connect');

-- Roles
INSERT INTO Roles (name, description) VALUES
('admin', 'Полный доступ'),
('user', 'Обычный покупатель'),
('manager', 'Управление заказами'),
('moderator', 'Модерация контента');

-- Users
INSERT INTO Users (username, email, password_hash) VALUES
('admin', 'admin@example.com', '$2b$10$hashed_admin_pass'),
('user1', 'user1@example.com', '$2b$10$hashed_user_pass');

-- UserRoles (RBAC: admin имеет роли admin+manager)
INSERT INTO UserRoles (user_id, role_id) VALUES
(1, 1), -- admin → admin
(1, 3), -- admin → manager
(2, 2); -- user1 → user

-- Games (FK на Platforms: Steam=1, EA=2)
INSERT INTO Games (title, platform_id, description) VALUES
('Counter-Strike 2', 1, 'Шутер от Valve'),
('FIFA 25', 2, 'Футбол от EA'),
('Fortnite', 3, 'Battle Royale от Epic');

-- Accounts + Keys
INSERT INTO Accounts (game_id, login, password_encrypted, price) VALUES
(1, 'csgo_pro', 'encrypted_csgo', 29.99),
(2, 'fifa_legend', 'encrypted_fifa', 39.99);

INSERT INTO Keys (game_id, key_code_encrypted, price) VALUES
(1, 'steam_key_csgo_abc', 19.99),
(2, 'ea_key_fifa_xyz', 24.99);