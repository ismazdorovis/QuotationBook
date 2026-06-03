const request = require('supertest');
const app = require('./app');

describe('QuotationBook API Tests', () => {
  
  test('GET /api/quote should return a random quote', async () => {
    const res = await request(app).get('/api/quote');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('text');
    expect(res.body).toHaveProperty('author');
  });

  test('GET /api/quotes should be protected (401)', async () => {
    const res = await request(app).get('/api/quotes');
    expect(res.statusCode).toEqual(401);
  });

  test('GET /api/quotes should work with valid credentials', async () => {
    const auth = Buffer.from('admin:gazpromneft123').toString('base64');
    const res = await request(app)
      .get('/api/quotes')
      .set('Authorization', `Basic ${auth}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/quote should be protected (401)', async () => {
    const res = await request(app)
      .post('/api/quote')
      .send({ text: 'Test quote', author: 'Test Author' });
    expect(res.statusCode).toEqual(401);
  });

  test('GET /non-existent-page should return 404', async () => {
    const res = await request(app).get('/some-random-url');
    expect(res.statusCode).toEqual(404);
  });
});