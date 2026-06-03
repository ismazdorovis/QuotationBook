const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const logger = require('./logger');
const redis = require('redis');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', (err) => logger.error(`Redis Client Error: ${err.message}`));
redisClient.connect().catch((err) => logger.error(`Redis Connection Error: ${err.message}`));

const CACHE_KEY = 'all_quotes';
const CACHE_TTL = 3600;

async function getAllQuotes() {
  try {
    const cachedData = await redisClient.get(CACHE_KEY);
    if (cachedData) {
      logger.info('Serving quotes from Redis cache');
      return JSON.parse(cachedData);
    }
    logger.info('Cache miss. Fetching quotes from PostgreSQL');
    const result = await pool.query('SELECT id, text, author FROM quotes ORDER BY id DESC');
    const quotes = result.rows;
    if (quotes.length > 0) {
      await redisClient.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(quotes));
    }
    return quotes;
  } catch (err) {
    logger.error(`Error in getAllQuotes: ${err.message}`);
    const result = await pool.query('SELECT id, text, author FROM quotes ORDER BY id DESC');
    return result.rows;
  }
}

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required');
  }
  const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const user = auth[0];
  const pass = auth[1];
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Invalid credentials');
  }
};

app.get('/api/quote', async (req, res) => {
  try {
    const quotes = await getAllQuotes();
    if (quotes.length > 0) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      res.json(randomQuote);
    } else {
      logger.warn('Random quote requested, but no quotes found in DB');
      res.status(404).json({ error: 'No quotes found' });
    }
  } catch (err) {
    logger.error(`Error in /api/quote: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/quotes', authMiddleware, async (req, res) => {
  try {
    const quotes = await getAllQuotes();
    res.json(quotes);
  } catch (err) {
    logger.error(`Error in /api/quotes: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/quote', authMiddleware, async (req, res) => {
  const { text, author } = req.body;
  if (!text || !author) {
    logger.warn('Attempt to add quote without text or author');
    return res.status(400).json({ error: 'Text and author are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO quotes (text, author) VALUES ($1, $2) RETURNING *',
      [text, author]
    );
    await redisClient.del(CACHE_KEY);
    logger.info(`Quote added and cache cleared: ID ${result.rows[0].id} by ${author}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error(`Error adding quote: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/quote/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM quotes WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      logger.warn(`Attempt to delete non-existent quote with ID ${id}`);
      return res.status(404).json({ error: 'Quote not found' });
    }
    await redisClient.del(CACHE_KEY);
    logger.info(`Quote ID ${id} deleted and cache cleared`);
    res.json({ message: 'Quote deleted successfully' });
  } catch (err) {
    logger.error(`Error deleting quote ID ${id}: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).send('404 Not Found');
});

module.exports = app;