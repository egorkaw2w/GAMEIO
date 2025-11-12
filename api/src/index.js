// api/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');

// Импортируем все маршруты
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const gamesRoutes = require('./routes/games');
const platformsRoutes = require('./routes/platforms');
const inventoryRoutes = require('./routes/inventory');
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const statisticsRoutes = require('./routes/statistics');
const exportRoutes = require('./routes/export');
const settingsRoutes = require('./routes/settings');
const backupRoutes = require('./routes/backup');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Подключаем базу данных
require('./db');

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({
    message: 'GameIO API',
    version: '1.0.0',
    status: 'OK',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      games: '/api/games',
      platforms: '/api/platforms',
      inventory: '/api/inventory',
      orders: '/api/orders',
      products: '/api/products',
      statistics: '/api/statistics',
      export: '/api/export',
      settings: '/api/settings',
      backup: '/api/backup',
      docs: '/api-docs'
    }
  });
});

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/platforms', platformsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);

// Swagger документация
try {
  const swaggerDoc = yaml.load(path.join(__dirname, '../openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  app.get('/openapi.yaml', (req, res) => {
    res.sendFile(path.join(__dirname, '../openapi.yaml'));
  });
} catch (err) {
  console.warn('Warning: Could not load OpenAPI specification:', err.message);
}

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Эндпоинт не найден' });
});

// Центральная обработка ошибок
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Обработка ошибок валидации
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: err.message
    });
  }

  // Обработка ошибок БД
  if (err.code) {
    const dbErrors = {
      '23505': 'Запись с такими данными уже существует',
      '23503': 'Ссылка на несуществующую запись',
      '23502': 'Обязательное поле не заполнено',
      '22P02': 'Неверный формат данных'
    };

    if (dbErrors[err.code]) {
      return res.status(400).json({
        error: dbErrors[err.code],
        details: err.detail || err.message
      });
    }
  }

  // Общая ошибка
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера'
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GameIO API running on http://0.0.0.0:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'game_store'}@${process.env.DB_HOST || 'db'}`);
});