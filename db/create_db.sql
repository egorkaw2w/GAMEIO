-- db/create_db.sql (версия 2.0: 3НФ + Roles + Platforms)

-- Таблица Platforms (нормализация платформ)
CREATE TABLE Platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица Roles (RBAC, легко добавлять роли)
CREATE TABLE Roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица Users
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- M:M Users ↔ Roles (RBAC)
CREATE TABLE UserRoles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES Roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Таблица Games (FK на Platforms)
CREATE TABLE Games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    platform_id INTEGER NOT NULL REFERENCES Platforms(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts, Keys (FK на Games)
CREATE TABLE Accounts (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES Games(id) ON DELETE CASCADE,
    login VARCHAR(100) NOT NULL,
    password_encrypted VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'sold')) DEFAULT 'available'
);

CREATE TABLE Keys (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES Games(id) ON DELETE CASCADE,
    key_code_encrypted VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'sold')) DEFAULT 'available'
);

-- Orders, OrderItems, Payments (без изменений)
CREATE TABLE Orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE OrderItems (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES Orders(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('account', 'key')),
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE TABLE Payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES Orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    method VARCHAR(20) NOT NULL CHECK (method IN ('card', 'paypal')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed'))
);

-- AuditLog, UserSettings
CREATE TABLE AuditLog (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE UserSettings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES Users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    page_size INTEGER DEFAULT 10 CHECK (page_size > 0)
);

-- Индексы
CREATE INDEX idx_games_platform ON Games(platform_id);
CREATE INDEX idx_accounts_game ON Accounts(game_id);
CREATE INDEX idx_keys_game ON Keys(game_id);
CREATE INDEX idx_orders_user ON Orders(user_id);
CREATE INDEX idx_userroles_user ON UserRoles(user_id);