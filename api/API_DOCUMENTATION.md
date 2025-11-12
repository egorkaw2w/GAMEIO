# GameIO API Documentation

## Содержание
1. [Введение](#введение)
2. [Аутентификация](#аутентификация)
3. [Эндпоинты](#эндпоинты)
4. [Модели данных](#модели-данных)
5. [Коды ошибок](#коды-ошибок)

---

## Введение

GameIO API предоставляет полный REST API для управления игровым магазином. API поддерживает:
- Аутентификацию пользователей с JWT токенами
- Управление пользователями и ролями (RBAC)
- CRUD операции для игр, платформ и инвентаря
- Систему заказов
- Статистику и аналитику
- Экспорт/импорт данных (CSV)
- Резервное копирование БД

**Base URL**: `http://localhost:3000/api`

**Swagger UI**: `http://localhost:3000/api-docs`

---

## Аутентификация

API использует JWT (JSON Web Tokens) для аутентификации.

### Регистрация
```
POST /api/auth/register
```

**Body**:
```json
{
  "username": "string (3-50 символов)",
  "email": "string (валидный email)",
  "password": "string (минимум 6 символов)"
}
```

**Response** (201):
```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Вход
```
POST /api/auth/login
```

**Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response** (200):
```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Использование токена

Все защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <jwt_token>
```

---

## Эндпоинты

### 1. Пользователи (`/api/users`)

#### Получить список пользователей
```
GET /api/users
```
**Требуется**: роль `admin` или `manager`

**Response** (200):
```json
[
  {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "created_at": "2025-01-01T00:00:00Z",
    "roles": [{"id": 1, "name": "user"}]
  }
]
```

#### Получить пользователя по ID
```
GET /api/users/:id
```
**Требуется**: аутентификация (свой профиль или admin/manager)

#### Обновить пользователя
```
PUT /api/users/:id
```
**Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Удалить пользователя
```
DELETE /api/users/:id
```
**Требуется**: роль `admin`

#### Добавить роль пользователю
```
POST /api/users/:id/roles
```
**Body**:
```json
{
  "role_id": 1
}
```
**Требуется**: роль `admin`

#### Удалить роль у пользователя
```
DELETE /api/users/:id/roles/:roleId
```
**Требуется**: роль `admin`

#### Получить заказы пользователя
```
GET /api/users/:id/orders
```

---

### 2. Игры (`/api/games`)

#### Получить список игр
```
GET /api/games?platform_id=1&search=название
```

**Response** (200):
```json
[
  {
    "id": 1,
    "title": "Cyberpunk 2077",
    "description": "RPG игра",
    "platform_id": 1,
    "platform_name": "PC",
    "created_at": "2025-01-01T00:00:00Z",
    "available_accounts": 5,
    "available_keys": 10
  }
]
```

#### Получить игру по ID
```
GET /api/games/:id
```

#### Создать игру
```
POST /api/games
```
**Требуется**: роль `admin` или `manager`

**Body**:
```json
{
  "title": "string (1-100 символов)",
  "platform_id": 1,
  "description": "string"
}
```

#### Обновить игру
```
PUT /api/games/:id
```
**Требуется**: роль `admin` или `manager`

#### Удалить игру
```
DELETE /api/games/:id
```
**Требуется**: роль `admin`

---

### 3. Платформы (`/api/platforms`)

#### Получить список платформ
```
GET /api/platforms
```

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "PC",
    "description": "Персональный компьютер",
    "created_at": "2025-01-01T00:00:00Z",
    "games_count": 150
  }
]
```

#### Создать платформу
```
POST /api/platforms
```
**Требуется**: роль `admin` или `manager`

**Body**:
```json
{
  "name": "string (1-50 символов)",
  "description": "string"
}
```

#### Получить игры платформы
```
GET /api/platforms/:id/games
```

---

### 4. Инвентарь (`/api/inventory`)

#### Аккаунты

##### Получить список аккаунтов
```
GET /api/inventory/accounts?game_id=1&status=available
```
**Требуется**: роль `admin` или `manager`

##### Создать аккаунт
```
POST /api/inventory/accounts
```
**Требуется**: роль `admin` или `manager`

**Body**:
```json
{
  "game_id": 1,
  "login": "string",
  "password": "string",
  "price": 999.99
}
```

##### Обновить аккаунт
```
PUT /api/inventory/accounts/:id
```

##### Удалить аккаунт
```
DELETE /api/inventory/accounts/:id
```
**Требуется**: роль `admin`

#### Ключи

##### Получить список ключей
```
GET /api/inventory/keys?game_id=1&status=available
```

##### Создать ключ
```
POST /api/inventory/keys
```
**Body**:
```json
{
  "game_id": 1,
  "key_code": "XXXX-XXXX-XXXX-XXXX",
  "price": 499.99
}
```

---

### 5. Заказы (`/api/orders`)

#### Получить список заказов
```
GET /api/orders
```
**Примечание**: Обычные пользователи видят только свои заказы

**Response** (200):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "username": "user123",
    "total_price": "1499.99",
    "status": "completed",
    "created_at": "2025-01-01T00:00:00Z",
    "items_count": 2
  }
]
```

#### Получить заказ по ID
```
GET /api/orders/:id
```

#### Создать заказ
```
POST /api/orders
```
**Body**:
```json
{
  "items": [
    {"game_id": 1, "platform_id": 1},
    {"game_id": 2, "platform_id": 1}
  ]
}
```

#### Отменить заказ
```
PATCH /api/orders/:id/cancel
```

#### Удалить заказ
```
DELETE /api/orders/:id
```
**Требуется**: роль `admin`

---

### 6. Статистика (`/api/statistics`)

#### Общая статистика
```
GET /api/statistics/overview
```
**Требуется**: роль `admin` или `manager`

**Response** (200):
```json
{
  "total_users": 100,
  "completed_orders": 50,
  "pending_orders": 5,
  "cancelled_orders": 2,
  "total_revenue": "49999.50",
  "total_games": 200,
  "available_accounts": 150,
  "available_keys": 300,
  "sold_accounts": 80,
  "sold_keys": 120
}
```

#### Продажи по играм
```
GET /api/statistics/sales-by-game?start_date=2025-01-01&end_date=2025-12-31&limit=10
```

#### Продажи по периодам
```
GET /api/statistics/sales-by-period?start_date=2025-01-01&end_date=2025-12-31&period=day
```
**Параметр period**: `hour`, `day`, `week`, `month`, `year`

#### Топ пользователей
```
GET /api/statistics/top-users?limit=10
```

#### Статус инвентаря
```
GET /api/statistics/inventory-status
```

#### Доход по платформам
```
GET /api/statistics/revenue-by-platform?start_date=2025-01-01&end_date=2025-12-31
```

#### Активность пользователей
```
GET /api/statistics/user-activity?start_date=2025-01-01&end_date=2025-12-31&period=day
```

---

### 7. Экспорт/Импорт (`/api/export`)

#### Экспорт пользователей
```
GET /api/export/users
```
**Требуется**: роль `admin` или `manager`
**Response**: CSV файл

#### Экспорт игр
```
GET /api/export/games
```
**Response**: CSV файл

#### Экспорт заказов
```
GET /api/export/orders?start_date=2025-01-01&end_date=2025-12-31
```
**Response**: CSV файл

#### Экспорт инвентаря
```
GET /api/export/inventory
```
**Response**: CSV файл

#### Экспорт статистики
```
GET /api/export/statistics
```
**Response**: CSV файл

#### Импорт игр из CSV
```
POST /api/export/import-games
```
**Body**:
```json
{
  "csv_data": "title,platform,description\nGame 1,PC,Description"
}
```

---

### 8. Настройки пользователя (`/api/settings`)

#### Получить настройки
```
GET /api/settings
```

**Response** (200):
```json
{
  "id": 1,
  "user_id": 1,
  "theme": "light",
  "date_format": "YYYY-MM-DD",
  "page_size": 10
}
```

#### Обновить настройки
```
PUT /api/settings
```
**Body**:
```json
{
  "theme": "dark",
  "date_format": "DD/MM/YYYY",
  "page_size": 20
}
```

#### Сбросить настройки
```
DELETE /api/settings
```

---

### 9. Резервное копирование (`/api/backup`)

#### Создать резервную копию
```
POST /api/backup/create
```
**Требуется**: роль `admin`

**Response** (200):
```json
{
  "message": "Резервная копия успешно создана",
  "filename": "backup_2025-01-01T12-00-00.sql",
  "size": 1024000,
  "created_at": "2025-01-01T12:00:00Z"
}
```

#### Получить список резервных копий
```
GET /api/backup/list
```
**Требуется**: роль `admin`

#### Скачать резервную копию
```
GET /api/backup/download/:filename
```
**Требуется**: роль `admin`

#### Восстановить из резервной копии
```
POST /api/backup/restore
```
**Body**:
```json
{
  "filename": "backup_2025-01-01T12-00-00.sql"
}
```
**Требуется**: роль `admin`

#### Удалить резервную копию
```
DELETE /api/backup/delete/:filename
```
**Требуется**: роль `admin`

---

### 10. Продукты (`/api/products`)

#### Получить список продуктов
```
GET /api/products
```

**Response** (200):
```json
[
  {
    "id": 1,
    "title": "Cyberpunk 2077",
    "description": "RPG игра",
    "platform": "PC",
    "price": 1999.99,
    "image": null,
    "availability": {
      "accounts": 5,
      "keys": 10
    },
    "inStock": true
  }
]
```

#### Получить продукт по ID
```
GET /api/products/:id
```

---

## Модели данных

### User
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "created_at": "timestamp",
  "roles": "array"
}
```

### Game
```json
{
  "id": "integer",
  "title": "string",
  "description": "string",
  "platform_id": "integer",
  "platform_name": "string",
  "created_at": "timestamp"
}
```

### Platform
```json
{
  "id": "integer",
  "name": "string",
  "description": "string",
  "created_at": "timestamp",
  "games_count": "integer"
}
```

### Order
```json
{
  "id": "integer",
  "user_id": "integer",
  "total_price": "decimal",
  "status": "enum: pending|completed|cancelled",
  "created_at": "timestamp",
  "items": "array"
}
```

---

## Коды ошибок

### HTTP статус коды

- **200 OK** - Успешный запрос
- **201 Created** - Ресурс успешно создан
- **400 Bad Request** - Ошибка валидации или некорректный запрос
- **401 Unauthorized** - Требуется аутентификация
- **403 Forbidden** - Недостаточно прав доступа
- **404 Not Found** - Ресурс не найден
- **500 Internal Server Error** - Внутренняя ошибка сервера

### Формат ошибок

```json
{
  "error": "Описание ошибки",
  "details": "Дополнительная информация (опционально)"
}
```

### Примеры ошибок

#### Ошибка валидации
```json
{
  "error": "Пароль должен содержать минимум 6 символов"
}
```

#### Ошибка аутентификации
```json
{
  "error": "Неверный email или пароль"
}
```

#### Ошибка прав доступа
```json
{
  "error": "Доступ запрещён"
}
```

#### Ошибка базы данных
```json
{
  "error": "Пользователь с таким email уже существует"
}
```

---

## Примеры использования

### Пример 1: Регистрация и создание заказа

```bash
# 1. Регистрация
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user123","email":"user@example.com","password":"pass123"}'

# Ответ: {"token":"jwt_token","user":{...}}

# 2. Получение списка игр
curl http://localhost:3000/api/products

# 3. Создание заказа
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"game_id":1,"platform_id":1}]}'
```

### Пример 2: Экспорт статистики (для админа)

```bash
# 1. Вход как админ
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# 2. Получение общей статистики
curl http://localhost:3000/api/statistics/overview \
  -H "Authorization: Bearer jwt_token"

# 3. Экспорт статистики в CSV
curl http://localhost:3000/api/export/statistics \
  -H "Authorization: Bearer jwt_token" \
  -o statistics.csv
```

---

## Лицензия

© 2025 GameIO. Все права защищены.
