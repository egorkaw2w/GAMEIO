// api/src/middleware/validation.js
// Middleware для валидации входных данных

/**
 * Валидация email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

/**
 * Валидация пароля (минимум 6 символов)
 */
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Валидация username (3-50 символов, только буквы, цифры, _, -)
 */
const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return usernameRegex.test(username);
};

/**
 * Валидация цены (положительное число)
 */
const isValidPrice = (price) => {
  return !isNaN(price) && parseFloat(price) > 0;
};

/**
 * Валидация ID (положительное целое число)
 */
const isValidId = (id) => {
  return Number.isInteger(Number(id)) && Number(id) > 0;
};

/**
 * Middleware для валидации регистрации
 */
const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: 'Все поля обязательны для заполнения'
    });
  }

  if (!isValidUsername(username)) {
    return res.status(400).json({
      error: 'Username должен содержать 3-50 символов (буквы, цифры, _ или -)'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Некорректный email адрес'
    });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      error: 'Пароль должен содержать минимум 6 символов'
    });
  }

  next();
};

/**
 * Middleware для валидации логина
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email и пароль обязательны для заполнения'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Некорректный email адрес'
    });
  }

  next();
};

/**
 * Middleware для валидации создания игры
 */
const validateGameCreation = (req, res, next) => {
  const { title, platform_id, description } = req.body;

  if (!title || !platform_id) {
    return res.status(400).json({
      error: 'Название игры и платформа обязательны'
    });
  }

  if (title.length < 1 || title.length > 100) {
    return res.status(400).json({
      error: 'Название игры должно содержать от 1 до 100 символов'
    });
  }

  if (!isValidId(platform_id)) {
    return res.status(400).json({
      error: 'Некорректный ID платформы'
    });
  }

  if (description && description.length > 1000) {
    return res.status(400).json({
      error: 'Описание не должно превышать 1000 символов'
    });
  }

  next();
};

/**
 * Middleware для валидации создания платформы
 */
const validatePlatformCreation = (req, res, next) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Название платформы обязательно'
    });
  }

  if (name.length < 1 || name.length > 50) {
    return res.status(400).json({
      error: 'Название платформы должно содержать от 1 до 50 символов'
    });
  }

  if (description && description.length > 500) {
    return res.status(400).json({
      error: 'Описание не должно превышать 500 символов'
    });
  }

  next();
};

/**
 * Middleware для валидации создания аккаунта
 */
const validateAccountCreation = (req, res, next) => {
  const { game_id, login, password, price } = req.body;

  if (!game_id || !login || !password || !price) {
    return res.status(400).json({
      error: 'Все поля обязательны для заполнения'
    });
  }

  if (!isValidId(game_id)) {
    return res.status(400).json({
      error: 'Некорректный ID игры'
    });
  }

  if (!isValidPrice(price)) {
    return res.status(400).json({
      error: 'Цена должна быть положительным числом'
    });
  }

  next();
};

/**
 * Middleware для валидации создания ключа
 */
const validateKeyCreation = (req, res, next) => {
  const { game_id, key_code, price } = req.body;

  if (!game_id || !key_code || !price) {
    return res.status(400).json({
      error: 'Все поля обязательны для заполнения'
    });
  }

  if (!isValidId(game_id)) {
    return res.status(400).json({
      error: 'Некорректный ID игры'
    });
  }

  if (!isValidPrice(price)) {
    return res.status(400).json({
      error: 'Цена должна быть положительным числом'
    });
  }

  next();
};

/**
 * Middleware для валидации создания заказа
 */
const validateOrderCreation = (req, res, next) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Заказ должен содержать хотя бы один товар'
    });
  }

  for (const item of items) {
    if (!item.game_id || !item.platform_id) {
      return res.status(400).json({
        error: 'Каждый товар должен содержать game_id и platform_id'
      });
    }

    if (!isValidId(item.game_id) || !isValidId(item.platform_id)) {
      return res.status(400).json({
        error: 'Некорректные ID в товарах заказа'
      });
    }
  }

  next();
};

/**
 * Middleware для валидации ID параметра
 */
const validateIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!isValidId(id)) {
      return res.status(400).json({
        error: `Некорректный ID: ${paramName}`
      });
    }

    next();
  };
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateGameCreation,
  validatePlatformCreation,
  validateAccountCreation,
  validateKeyCreation,
  validateOrderCreation,
  validateIdParam,
  // Экспортируем вспомогательные функции для использования в других местах
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidPrice,
  isValidId,
};
