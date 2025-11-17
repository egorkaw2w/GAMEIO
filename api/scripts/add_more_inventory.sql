-- Скрипт для добавления большого ассортимента ключей и аккаунтов для существующих игр

-- Проверим существующие игры
-- SELECT id, title FROM Games;

-- ========================================
-- Counter-Strike 2 (game_id = 1)
-- ========================================

-- Добавляем ключи для CS2
INSERT INTO Keys (game_id, key_code_encrypted, price, status) VALUES
(1, 'CS2-PRIME-2024-KEY-001', 499.00, 'available'),
(1, 'CS2-PRIME-2024-KEY-002', 499.00, 'available'),
(1, 'CS2-PRIME-2024-KEY-003', 499.00, 'available'),
(1, 'CS2-PRIME-2024-KEY-004', 499.00, 'available'),
(1, 'CS2-PRIME-2024-KEY-005', 499.00, 'available'),
(1, 'CS2-PRIME-2024-KEY-006', 549.00, 'available'),
(1, 'CS2-PRIME-2024-KEY-007', 549.00, 'available'),
(1, 'CS2-PRIME-2024-KEY-008', 549.00, 'available'),
(1, 'CS2-PRIME-2024-KEY-009', 599.00, 'available'),
(1, 'CS2-PRIME-2024-KEY-010', 599.00, 'available');

-- Добавляем аккаунты для CS2
INSERT INTO Accounts (game_id, login, password_encrypted, price, status) VALUES
(1, 'cs2_pro_001', 'SecurePass2024!', 699.00, 'available'),
(1, 'cs2_pro_002', 'SecurePass2024!', 699.00, 'available'),
(1, 'cs2_pro_003', 'SecurePass2024!', 749.00, 'available'),
(1, 'cs2_pro_004', 'SecurePass2024!', 749.00, 'available'),
(1, 'cs2_legend_001', 'LegendPass123!', 899.00, 'available'),
(1, 'cs2_legend_002', 'LegendPass123!', 899.00, 'available'),
(1, 'cs2_legend_003', 'LegendPass123!', 999.00, 'available'),
(1, 'cs2_global_001@mail.com', 'GlobalPass2024!', 1299.00, 'available'),
(1, 'cs2_global_002@mail.com', 'GlobalPass2024!', 1299.00, 'available'),
(1, 'cs2_supreme_001@mail.com', 'SupremePass!', 1499.00, 'available');

-- ========================================
-- FIFA 25 (game_id = 2)
-- ========================================

-- Добавляем ключи для FIFA 25
INSERT INTO Keys (game_id, key_code_encrypted, price, status) VALUES
(2, 'FIFA25-ULTIMATE-001', 1999.00, 'available'),
(2, 'FIFA25-ULTIMATE-002', 1999.00, 'available'),
(2, 'FIFA25-ULTIMATE-003', 2099.00, 'available'),
(2, 'FIFA25-ULTIMATE-004', 2099.00, 'available'),
(2, 'FIFA25-ULTIMATE-005', 2199.00, 'available'),
(2, 'FIFA25-ULTIMATE-006', 2199.00, 'available'),
(2, 'FIFA25-DELUXE-001', 1799.00, 'available'),
(2, 'FIFA25-DELUXE-002', 1799.00, 'available'),
(2, 'FIFA25-STANDARD-001', 1599.00, 'available'),
(2, 'FIFA25-STANDARD-002', 1599.00, 'available');

-- Добавляем аккаунты для FIFA 25
INSERT INTO Accounts (game_id, login, password_encrypted, price, status) VALUES
(2, 'fifa25_ultimate_001@mail.com', 'FifaUlt2024!', 2299.00, 'available'),
(2, 'fifa25_ultimate_002@mail.com', 'FifaUlt2024!', 2299.00, 'available'),
(2, 'fifa25_ultimate_003@mail.com', 'FifaUlt2024!', 2399.00, 'available'),
(2, 'fifa25_pro_001@mail.com', 'FifaPro123!', 1999.00, 'available'),
(2, 'fifa25_pro_002@mail.com', 'FifaPro123!', 1999.00, 'available'),
(2, 'fifa25_pro_003@mail.com', 'FifaPro123!', 2099.00, 'available'),
(2, 'fifa25_starter_001', 'Starter2024!', 1699.00, 'available'),
(2, 'fifa25_starter_002', 'Starter2024!', 1699.00, 'available'),
(2, 'fifa25_champion_001@mail.com', 'Champion!2024', 2599.00, 'available'),
(2, 'fifa25_champion_002@mail.com', 'Champion!2024', 2599.00, 'available');

-- ========================================
-- Fortnite (game_id = 3)
-- ========================================

-- Добавляем ключи для Fortnite
INSERT INTO Keys (game_id, key_code_encrypted, price, status) VALUES
(3, 'FORT-VBUCKS-1000-001', 899.00, 'available'),
(3, 'FORT-VBUCKS-1000-002', 899.00, 'available'),
(3, 'FORT-VBUCKS-1000-003', 899.00, 'available'),
(3, 'FORT-VBUCKS-2800-001', 1999.00, 'available'),
(3, 'FORT-VBUCKS-2800-002', 1999.00, 'available'),
(3, 'FORT-VBUCKS-2800-003', 1999.00, 'available'),
(3, 'FORT-VBUCKS-5000-001', 2999.00, 'available'),
(3, 'FORT-VBUCKS-5000-002', 2999.00, 'available'),
(3, 'FORT-BATTLEPASS-S6-001', 1299.00, 'available'),
(3, 'FORT-BATTLEPASS-S6-002', 1299.00, 'available');

-- Добавляем аккаунты для Fortnite
INSERT INTO Accounts (game_id, login, password_encrypted, price, status) VALUES
(3, 'fortnite_og_001@mail.com', 'OgAccount2024!', 3999.00, 'available'),
(3, 'fortnite_og_002@mail.com', 'OgAccount2024!', 3999.00, 'available'),
(3, 'fortnite_rare_001@mail.com', 'RareSkins123!', 2999.00, 'available'),
(3, 'fortnite_rare_002@mail.com', 'RareSkins123!', 2999.00, 'available'),
(3, 'fortnite_rare_003@mail.com', 'RareSkins123!', 3199.00, 'available'),
(3, 'fortnite_pro_001', 'ProPlayer!', 1999.00, 'available'),
(3, 'fortnite_pro_002', 'ProPlayer!', 1999.00, 'available'),
(3, 'fortnite_starter_001', 'Starter2024!', 1299.00, 'available'),
(3, 'fortnite_starter_002', 'Starter2024!', 1299.00, 'available'),
(3, 'fortnite_battlepass_001@mail.com', 'BattlePass!', 1599.00, 'available');

-- Проверяем результат
SELECT
    g.title as game,
    COUNT(DISTINCT k.id) as keys_count,
    COUNT(DISTINCT a.id) as accounts_count
FROM Games g
LEFT JOIN Keys k ON g.id = k.game_id AND k.status = 'available'
LEFT JOIN Accounts a ON g.id = a.game_id AND a.status = 'available'
GROUP BY g.id, g.title
ORDER BY g.title;
