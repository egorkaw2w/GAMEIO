// api/src/routes/backup.js
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const { verifyToken, requireRole } = require('../middleware/auth');

const execAsync = promisify(exec);

const DB_HOST = process.env.DB_HOST || 'db';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '1';
const DB_NAME = process.env.DB_NAME || 'game_store';
const BACKUP_DIR = process.env.BACKUP_DIR || '/backups';

/**
 * POST /api/backup/create
 * Создать резервную копию базы данных
 */
router.post('/create', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Создаём директорию для бэкапов, если её нет
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (err) {
      // Игнорируем ошибку, если директория уже существует
    }

    // Выполняем pg_dump
    const command = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f ${filepath}`;

    await execAsync(command);

    // Проверяем, что файл создан
    const stats = await fs.stat(filepath);

    res.json({
      message: 'Резервная копия успешно создана',
      filename,
      size: stats.size,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error creating backup:', err);
    res.status(500).json({ error: 'Не удалось создать резервную копию', details: err.message });
  }
});

/**
 * GET /api/backup/list
 * Получить список резервных копий
 */
router.get('/list', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    // Проверяем, существует ли директория
    try {
      await fs.access(BACKUP_DIR);
    } catch (err) {
      return res.json({ backups: [] });
    }

    const files = await fs.readdir(BACKUP_DIR);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filepath);

        backups.push({
          filename: file,
          size: stats.size,
          created_at: stats.birthtime.toISOString()
        });
      }
    }

    // Сортируем по дате создания (новые сначала)
    backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ backups });
  } catch (err) {
    console.error('Error listing backups:', err);
    res.status(500).json({ error: 'Не удалось получить список резервных копий' });
  }
});

/**
 * GET /api/backup/download/:filename
 * Скачать резервную копию
 */
router.get('/download/:filename', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const filename = req.params.filename;

    // Проверяем, что filename содержит только допустимые символы
    if (!/^backup_[\d-]+\.sql$/.test(filename)) {
      return res.status(400).json({ error: 'Некорректное имя файла' });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    // Проверяем, существует ли файл
    try {
      await fs.access(filepath);
    } catch (err) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    res.download(filepath, filename);
  } catch (err) {
    console.error('Error downloading backup:', err);
    res.status(500).json({ error: 'Не удалось скачать резервную копию' });
  }
});

/**
 * POST /api/backup/restore
 * Восстановить базу данных из резервной копии
 */
router.post('/restore', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Имя файла обязательно' });
    }

    // Проверяем, что filename содержит только допустимые символы
    if (!/^backup_[\d-]+\.sql$/.test(filename)) {
      return res.status(400).json({ error: 'Некорректное имя файла' });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    // Проверяем, существует ли файл
    try {
      await fs.access(filepath);
    } catch (err) {
      return res.status(404).json({ error: 'Файл резервной копии не найден' });
    }

    // Выполняем восстановление
    const command = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${filepath}`;

    await execAsync(command);

    res.json({
      message: 'База данных успешно восстановлена',
      filename,
      restored_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error restoring backup:', err);
    res.status(500).json({ error: 'Не удалось восстановить базу данных', details: err.message });
  }
});

/**
 * DELETE /api/backup/delete/:filename
 * Удалить резервную копию
 */
router.delete('/delete/:filename', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const filename = req.params.filename;

    // Проверяем, что filename содержит только допустимые символы
    if (!/^backup_[\d-]+\.sql$/.test(filename)) {
      return res.status(400).json({ error: 'Некорректное имя файла' });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    // Удаляем файл
    await fs.unlink(filepath);

    res.json({
      message: 'Резервная копия успешно удалена',
      filename
    });
  } catch (err) {
    console.error('Error deleting backup:', err);
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    res.status(500).json({ error: 'Не удалось удалить резервную копию' });
  }
});

module.exports = router;
