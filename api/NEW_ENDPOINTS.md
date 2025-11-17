# Новые API Endpoints

## Обновления для поддержки улучшенного Frontend

### 1. Получение деталей заказа (Orders)

#### `GET /api/orders/:id`
**Улучшено:** Теперь возвращает полную информацию о товарах в заказе

**Ответ:**
```json
{
  "id": 1,
  "user_id": 1,
  "username": "user123",
  "email": "user@example.com",
  "total_price": "1500.00",
  "status": "completed",
  "created_at": "2025-01-12T10:00:00.000Z",
  "items": [
    {
      "id": 1,
      "item_type": "key",
      "item_id": 5,
      "quantity": 1,
      "product_details": {
        "id": 5,
        "game_id": 10,
        "game_title": "Cyberpunk 2077",
        "platform_id": 1,
        "platform_name": "Steam",
        "price": "1500.00",
        "key_code": "XXXX-XXXX-XXXX",
        "region": "Global"
      }
    }
  ]
}
```

**Использование:** Функция "Повторить заказ" на frontend получает полные данные о товарах для добавления их в корзину.

---

### 2. Управление профилем пользователя (Users)

#### `GET /api/users/me`
Получить информацию о текущем авторизованном пользователе

**Заголовки:**
```
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "created_at": "2025-01-01T00:00:00.000Z",
  "roles": [
    {
      "id": 1,
      "name": "user"
    }
  ]
}
```

---

#### `PATCH /api/users/me/username`
Изменить имя пользователя

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "username": "new_username"
}
```

**Ответ:**
```json
{
  "message": "Имя пользователя успешно обновлено",
  "user": {
    "id": 1,
    "username": "new_username",
    "email": "user@example.com",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Валидация:**
- Минимум 3 символа
- Уникальность

---

#### `PATCH /api/users/me/email`
Изменить email

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "email": "newemail@example.com"
}
```

**Ответ:**
```json
{
  "message": "Email успешно обновлён",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "newemail@example.com",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Валидация:**
- Корректный формат email
- Уникальность

---

#### `PATCH /api/users/me/password`
Изменить пароль

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password123"
}
```

**Ответ:**
```json
{
  "message": "Пароль успешно изменён"
}
```

**Валидация:**
- Текущий пароль должен быть корректным
- Новый пароль минимум 6 символов

---

## Использование на Frontend

### Страница Settings (SettingsPage.tsx)

```typescript
// Изменение имени пользователя
const response = await api.patch('/users/me/username', { username: 'new_name' });

// Изменение email
const response = await api.patch('/users/me/email', { email: 'new@email.com' });

// Изменение пароля
const response = await api.patch('/users/me/password', {
  currentPassword: 'oldpass',
  newPassword: 'newpass'
});
```

### Повтор заказа (OrdersPage.tsx)

```typescript
// Получение деталей заказа
const response = await api.get(`/orders/${orderId}`);
const orderItems = response.data.items;

// Добавление товаров в корзину
orderItems.forEach(item => {
  const product = item.product_details;
  addToCart({
    id: product.game_id,
    title: product.game_title,
    platform: product.platform_name,
    price: parseFloat(product.price),
    quantity: item.quantity
  });
});
```

---

## Коды ошибок

- **400** - Ошибка валидации (неверный формат данных, дубликаты)
- **401** - Не авторизован (отсутствует или невалидный токен)
- **403** - Доступ запрещён
- **404** - Ресурс не найден
- **500** - Внутренняя ошибка сервера

---

## Примечания

1. Все endpoints требуют авторизации через JWT токен в заголовке `Authorization: Bearer <token>`
2. Email автоматически приводится к lowercase
3. Username и email должны быть уникальными
4. При смене пароля обязательна проверка текущего пароля
5. Все изменения логируются на сервере
