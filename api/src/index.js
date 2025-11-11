// api/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

require('./db');

app.get('/', (req, res) => {
  res.json({ message: 'GameIO API', version: '1.0', status: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

const swaggerDoc = yaml.load('./openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.get('/openapi.yaml', (req, res) => {
  res.sendFile('openapi.yaml', { root: __dirname });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});