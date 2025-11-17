-- Добавление дополнительных игр и товаров

-- Добавляем больше игр
INSERT INTO Games (title, description, platform_id, price, image) VALUES
('Red Dead Redemption 2', 'Эпическое приключение на Диком Западе от создателей GTA V', 1, 2499.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202010/2618/Y0bNuRfJaTNaJj8S4KlRRLeR.png'),
('The Witcher 3', 'Легендарная RPG о ведьмаке Геральте в открытом мире', 1, 999.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202211/0711/kh4MUIuMmHlktOHar3lVl6rY.png'),
('God of War', 'Новая глава приключений Кратоса и его сына Атрея', 2, 1799.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png'),
('Elden Ring', 'Совместный проект FromSoftware и Джорджа Р.Р. Мартина', 1, 2999.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/aGhopp3MHppi7kUEXmKHOFmX.png'),
('Horizon Zero Dawn', 'Откройте для себя мир, где правят машины', 1, 1499.00, 'https://image.api.playstation.com/vulcan/img/rnd/202009/2923/jAT7HjpL9pvM3QK0d1hJZlXW.png'),
('Spider-Man', 'Станьте легендарным супергероем в Нью-Йорке', 2, 2299.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202008/1020/T45iRzkRaq04y1aQnC85B4zA.png'),
('The Last of Us Part II', 'Продолжение легендарной истории Элли', 2, 2799.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202311/2812/63c9e93e49e61e35438dc8b11aac7a06e8e2f8d4bb39e25d.png'),
('Ghost of Tsushima', 'Станьте призраком, защищающим остров Цусима', 2, 2499.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202010/0109/4aYi9UKW2Uh7p2K5cUWFuV5a.png'),
('Death Stranding', 'Уникальный опыт от Хидео Кодзимы', 1, 1999.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202211/0712/wbU68XPF1Jwg3YFdbbF8JLhC.png'),
('Bloodborne', 'Готический хоррор от создателей Dark Souls', 2, 1299.00, 'https://image.api.playstation.com/vulcan/img/rnd/202010/2614/NVmnBXze9ElHzU6SmykrJLIV.png'),
('Sekiro: Shadows Die Twice', 'Сложный самурайский экшен от FromSoftware', 1, 1799.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202010/2722/TgxGCG2nZDPPGzCj3X9cXYRW.png'),
('Final Fantasy VII Remake', 'Переосмысление легендарной JRPG', 2, 2999.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/CkKoM9hJsSBfmYY0gBT3IhgX.png'),
('Resident Evil Village', 'Хоррор-выживание от Capcom', 1, 1899.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202101/0812/FkzwjnJknkrFlozkTdeQBMub.png'),
('Control', 'Сверхъестественный экшен с кинематографичным сюжетом', 1, 899.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202002/1800/0JJfqoJqw5pKZCcMhZZ2xpZM.png'),
('Metro Exodus', 'Постапокалиптический шутер в мире Метро 2033', 1, 1299.00, 'https://image.api.playstation.com/vulcan/ap/rnd/201812/1400/GqQ4d0YdGP0eZCMIxN7qmAXr.png'),
('Doom Eternal', 'Безумный экшен против демонов ада', 1, 1199.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202010/0114/ERNPc4gFqeMAv3l8HXvOyMgW.png'),
('Hades', 'Roguelike от создателей Bastion', 1, 799.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202104/0517/9AcM3vy5t77zPiJyKHwRfnNT.png'),
('It Takes Two', 'Кооперативное приключение для двоих', 1, 1499.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202012/0815/RWwccfQbhKGUcNmCk8Y8sLa8.png'),
('Assassins Creed Valhalla', 'Стань легендарным викингом', 1, 2299.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202008/1318/8k4e6ARSvNZDZ6nCfhkbrnFN.png'),
('Far Cry 6', 'Революция на тропическом острове Яра', 1, 1999.00, 'https://image.api.playstation.com/vulcan/ap/rnd/202106/0722/bnYyKPCDkHIqLDyGpuiT5s4q.png');

-- Добавляем ключи для новых игр
-- Ключи для Red Dead Redemption 2
INSERT INTO Keys (game_id, price, key_code, region, status) VALUES
(4, 2499.00, 'RDR2-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(4, 2499.00, 'RDR2-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(4, 2499.00, 'RDR2-XXXX-YYYY-ZZZZ-0003', 'Global', 'available');

-- Ключи для The Witcher 3
INSERT INTO Keys (game_id, price, key_code, region, status) VALUES
(5, 999.00, 'W3-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(5, 999.00, 'W3-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(5, 999.00, 'W3-XXXX-YYYY-ZZZZ-0003', 'Global', 'available'),
(5, 999.00, 'W3-XXXX-YYYY-ZZZZ-0004', 'Global', 'available');

-- Ключи для God of War
INSERT INTO Keys (game_id, price, key_code, region, status) VALUES
(6, 1799.00, 'GOW-XXXX-YYYY-ZZZZ-0001', 'EU', 'available'),
(6, 1799.00, 'GOW-XXXX-YYYY-ZZZZ-0002', 'EU', 'available');

-- Ключи для Elden Ring
INSERT INTO Keys (game_id, price, key_code, region, status) VALUES
(7, 2999.00, 'ER-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(7, 2999.00, 'ER-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(7, 2999.00, 'ER-XXXX-YYYY-ZZZZ-0003', 'Global', 'available'),
(7, 2999.00, 'ER-XXXX-YYYY-ZZZZ-0004', 'Global', 'available'),
(7, 2999.00, 'ER-XXXX-YYYY-ZZZZ-0005', 'Global', 'available');

-- Ключи для Horizon Zero Dawn
INSERT INTO Keys (game_id, price, key_code, region, status) VALUES
(8, 1499.00, 'HZD-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(8, 1499.00, 'HZD-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(8, 1499.00, 'HZD-XXXX-YYYY-ZZZZ-0003', 'Global', 'available');

-- Ключи для Spider-Man
INSERT INTO Keys (game_id, price, key_code, region, status) VALUES
(9, 2299.00, 'SM-XXXX-YYYY-ZZZZ-0001', 'US', 'available'),
(9, 2299.00, 'SM-XXXX-YYYY-ZZZZ-0002', 'US', 'available');

-- Ключи для остальных игр
INSERT INTO Keys (game_id, price, key_code, region, status) VALUES
(11, 1999.00, 'DS-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(11, 1999.00, 'DS-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(13, 1799.00, 'SEK-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(13, 1799.00, 'SEK-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(13, 1799.00, 'SEK-XXXX-YYYY-ZZZZ-0003', 'Global', 'available'),
(15, 1899.00, 'REV-XXXX-YYYY-ZZZZ-0001', 'EU', 'available'),
(15, 1899.00, 'REV-XXXX-YYYY-ZZZZ-0002', 'EU', 'available'),
(16, 899.00, 'CTRL-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(16, 899.00, 'CTRL-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(16, 899.00, 'CTRL-XXXX-YYYY-ZZZZ-0003', 'Global', 'available'),
(17, 1299.00, 'ME-XXXX-YYYY-ZZZZ-0001', 'RU', 'available'),
(17, 1299.00, 'ME-XXXX-YYYY-ZZZZ-0002', 'RU', 'available'),
(18, 1199.00, 'DOOM-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(18, 1199.00, 'DOOM-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(18, 1199.00, 'DOOM-XXXX-YYYY-ZZZZ-0003', 'Global', 'available'),
(19, 799.00, 'HADES-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(19, 799.00, 'HADES-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(19, 799.00, 'HADES-XXXX-YYYY-ZZZZ-0003', 'Global', 'available'),
(19, 799.00, 'HADES-XXXX-YYYY-ZZZZ-0004', 'Global', 'available'),
(20, 1499.00, 'ITT-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(20, 1499.00, 'ITT-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(21, 2299.00, 'ACV-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(21, 2299.00, 'ACV-XXXX-YYYY-ZZZZ-0002', 'Global', 'available'),
(22, 1999.00, 'FC6-XXXX-YYYY-ZZZZ-0001', 'Global', 'available'),
(22, 1999.00, 'FC6-XXXX-YYYY-ZZZZ-0002', 'Global', 'available');

-- Добавляем аккаунты для некоторых игр
INSERT INTO Accounts (game_id, price, login, password, additional_info, status) VALUES
(6, 1699.00, 'gow_account_001@email.com', 'Password123!', 'Full game, all DLCs', 'available'),
(6, 1699.00, 'gow_account_002@email.com', 'Password123!', 'Full game, progress 50%', 'available'),
(9, 2199.00, 'spiderman_acc_001@email.com', 'Password123!', 'Complete Edition', 'available'),
(10, 2699.00, 'tlou2_account_001@email.com', 'Password123!', 'Full game + extras', 'available'),
(11, 1899.00, 'got_account_001@email.com', 'Password123!', 'Directors Cut', 'available'),
(12, 1199.00, 'bloodborne_acc_001@email.com', 'Password123!', 'Game + DLC', 'available'),
(12, 1199.00, 'bloodborne_acc_002@email.com', 'Password123!', 'Complete Edition', 'available'),
(14, 2899.00, 'ff7r_account_001@email.com', 'Password123!', 'Full game + Intermission', 'available');
