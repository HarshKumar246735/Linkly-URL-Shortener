import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app.js';
import { CSRF } from './helpers.js';

describe('rate limiting', () => {
  beforeAll(() => { process.env.ENABLE_RATE_LIMIT_TESTS = '1'; });
  afterAll(() => { delete process.env.ENABLE_RATE_LIMIT_TESTS; });

  it('limits anonymous link creation per IP', async () => {
    let last;
    for (let i = 0; i < 16; i += 1) {
      last = await request(app).post('/api/urls/shorten').set(CSRF).send({ originalUrl: `https://example.com/${i}` });
    }
    expect(last.status).toBe(429);
    expect(last.body.error.code).toBe('RATE_LIMITED');
  });

  it('limits login attempts', async () => {
    let last;
    for (let i = 0; i < 21; i += 1) {
      last = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'a@example.com', password: 'WrongPass1' });
    }
    expect(last.status).toBe(429);
  });
});
