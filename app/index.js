const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware для парсинга JSON-тел запросов
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 1. Получить случайную цитату (для главной страницы)
app.get('/api/quote', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, text, author FROM quotes ORDER BY RANDOM() LIMIT 1');
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'No quotes found' });
    }
  } catch (err) {
    console.error('Error fetching random quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Получить все цитаты (для админки)
app.get('/api/quotes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quotes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all quotes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Добавить новую цитату
app.post('/api/quote', async (req, res) => {
  const { text, author } = req.body;
  if (!text || !author) {
    return res.status(400).json({ error: 'Text and author are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO quotes (text, author) VALUES ($1, $2) RETURNING *',
      [text, author]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Удалить цитату
app.delete('/api/quote/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM quotes WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    res.json({ message: 'Quote deleted successfully' });
  } catch (err) {
    console.error('Error deleting quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});