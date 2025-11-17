-- Скрипт для добавления ассортимента ключей и аккаунтов

-- Сначала проверим, какие игры есть в БД
-- SELECT id, title FROM Games ORDER BY id;

-- Добавляем больше ключей для существующих игр
-- CS:GO (game_id = 1)
INSERT INTO Keys (game_id, key_code_encrypted, price, status) VALUES
(1, 'CSGO-2024-PRIME-KEY-0001', 499.00, 'available'),
(1, 'CSGO-2024-PRIME-KEY-0002', 499.00, 'available'),
(1, 'CSGO-2024-PRIME-KEY-0003', 499.00, 'available'),
(1, 'CSGO-2024-PRIME-KEY-0004', 499.00, 'available'),
(1, 'CSGO-2024-PRIME-KEY-0005', 499.00, 'available');

-- FIFA 23 (game_id = 2)
INSERT INTO Keys (game_id, key_code_encrypted, price, status) VALUES
(2, 'FIFA23-ULTIMATE-KEY-0001', 1999.00, 'available'),
(2, 'FIFA23-ULTIMATE-KEY-0002', 1999.00, 'available'),
(2, 'FIFA23-ULTIMATE-KEY-0003', 1999.00, 'available'),
(2, 'FIFA23-ULTIMATE-KEY-0004', 1999.00, 'available');

-- Minecraft (game_id = 3)
INSERT INTO Keys (game_id, key_code_encrypted, price, status) VALUES
(3, 'MC-JAVA-EDITION-KEY-0001', 899.00, 'available'),
(3, 'MC-JAVA-EDITION-KEY-0002', 899.00, 'available'),
(3, 'MC-JAVA-EDITION-KEY-0003', 899.00, 'available'),
(3, 'MC-JAVA-EDITION-KEY-0004', 899.00, 'available'),
(3, 'MC-JAVA-EDITION-KEY-0005', 899.00, 'available'),
(3, 'MC-JAVA-EDITION-KEY-0006', 899.00, 'available');

-- Добавляем больше аккаунтов для существующих игр
-- CS:GO (game_id = 1)
INSERT INTO Accounts (game_id, login, password_encrypted, price, status) VALUES
('1', 'csgo_legend_001', 'SecurePass2024!', 599.00, 'available'),
('1', 'csgo_legend_002', 'SecurePass2024!', 599.00, 'available'),
('1', 'csgo_legend_003', 'SecurePass2024!', 699.00, 'available'),
('1', 'csgo_legend_004', 'SecurePass2024!', 799.00, 'available'),
('1', 'csgo_legend_005', 'SecurePass2024!', 549.00, 'available');

-- FIFA 23 (game_id = 2)
INSERT INTO Accounts (game_id, login, password_encrypted, price, status) VALUES
('2', 'fifa23_pro_001@email.com', 'FifaPass123!', 2199.00, 'available'),
('2', 'fifa23_pro_002@email.com', 'FifaPass123!', 2199.00, 'available'),
('2', 'fifa23_pro_003@email.com', 'FifaPass123!', 2499.00, 'available'),
('2', 'fifa23_pro_004@email.com', 'FifaPass123!', 1999.00, 'available');

-- Minecraft (game_id = 3)
INSERT INTO Accounts (game_id, login, password_encrypted, price, status) VALUES
('3', 'minecraft_builder_001', 'MCPass2024!', 999.00, 'available'),
('3', 'minecraft_builder_002', 'MCPass2024!', 999.00, 'available'),
('3', 'minecraft_builder_003', 'MCPass2024!', 1099.00, 'available'),
('3', 'minecraft_builder_004', 'MCPass2024!', 1099.00, 'available'),
('3', 'minecraft_builder_005', 'MCPass2024!', 1199.00, 'available');

-- God of War (game_id = 6)
INSERT INTO Keys (game_id, key_code_encrypted, price, status) VALUES
(6, 'GOW-STEAM-KEY-2024-0001', 1799.00, 'available'),
(6, 'GOW-STEAM-KEY-2024-0002', 1799.00, 'available'),
(6, 'GOW-STEAM-KEY-2024-0003', 1799.00, 'available'),
(6, 'GOW-STEAM-KEY-2024-0004', 1799.00, 'available');

INSERT INTO Accounts (game_id, login, password_encrypted, price, status) VALUES
('6', 'gow_warrior_003@email.com', 'KratosPass123!', 1699.00, 'available'),
('6', 'gow_warrior_004@email.com', 'KratosPass123!', 1699.00, 'available'),
('6', 'gow_warrior_005@email.com', 'KratosPass123!', 1799.00, 'available');

-- RDR2 (game_id = 4)
INSERT INTO Keys (game_id, key_code_encrypted, price, status) VALUES
(4, 'RDR2-ROCKSTAR-KEY-0001', 2499.00, 'available'),
(4, 'RDR2-ROCKSTAR-KEY-0002', 2499.00, 'available'),
(4, 'RDR2-ROCKSTAR-KEY-0003', 2499.00, 'available'),
(4, 'RDR2-ROCKSTAR-KEY-0004', 2499.00, 'available'),
(4, 'RDR2-ROCKSTAR-KEY-0005', 2499.00, 'available');

INSERT INTO Accounts (game_id, login, password_encrypted, price, status) VALUES
('4', 'rdr2_cowboy_001@email.com', 'WildWest2024!', 2399.00, 'available'),
('4', 'rdr2_cowboy_002@email.com', 'WildWest2024!', 2399.00, 'available'),
('4', 'rdr2_cowboy_003@email.com', 'WildWest2024!', 2599.00, 'available');

-- The Witcher 3 (game_id = 5)
INSERT INTO Keys (game_id, key_code_encrypted, price, status) VALUES
(5, 'W3-GOTY-STEAM-KEY-0001', 999.00, 'available'),
(5, 'W3-GOTY-STEAM-KEY-0002', 999.00, 'available'),
(5, 'W3-GOTY-STEAM-KEY-0003', 999.00, 'available'),
(5, 'W3-GOTY-STEAM-KEY-0004', 999.00, 'available'),
(5, 'W3-GOTY-STEAM-KEY-0005', 999.00, 'available');

INSERT INTO Accounts (game_id, login, password_encrypted, price, status) VALUES
('5', 'witcher3_fan_001@email.com', 'GeraltPass123!', 899.00, 'available'),
('5', 'witcher3_fan_002@email.com', 'GeraltPass123!', 899.00, 'available'),
('5', 'witcher3_fan_003@email.com', 'GeraltPass123!', 999.00, 'available'),
('5', 'witcher3_fan_004@email.com', 'GeraltPass123!', 999.00, 'available');
