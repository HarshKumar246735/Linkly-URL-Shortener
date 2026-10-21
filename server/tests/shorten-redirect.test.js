import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import { Url } from '../models/Url.js';
import { CSRF, shortenAs } from './helpers.js';

const post = (body) => request(app).post('/api/urls/shorten').set(CSRF).send(body);

describe('creating short links', () => {
  it('shortens a valid URL for an anonymous visitor', async () => {
    const res = await post({ originalUrl: 'https://example.com/products/electronics/mobile-phones' });
    expect(res.status).toBe(201);
    const { url, isAnonymous } = res.body.data;
    expect(isAnonymous).toBe(true);
    expect(url.shortCode).toMatch(/^[A-Za-z0-9]{7}$/);
    expect(url.shortUrl).toBe(`http://localhost:5000/${url.shortCode}`);
    expect(url.status).toBe('active');
    const stored = await Url.findOne({ shortCode: url.shortCode });
    expect(stored.userId).toBeNull();
  });

  it.each([
    ['not a url', 'definitely not a url'],
    ['javascript: scheme', 'javascript:alert(1)'],
    ['data: scheme', 'data:text/html;base64,PHNjcmlwdD4='],
    ['file: scheme', 'file:///etc/passwd'],
    ['ftp: scheme', 'ftp://example.com/file'],
    ['embedded credentials', 'https://user:pass@example.com'],
    ['own short domain', 'http://localhost:5000/abc1234'],
  ])('rejects %s', async (_label, originalUrl) => {
    const res = await post({ originalUrl });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing, non-string and unknown fields', async () => {
    expect((await post({})).status).toBe(422);
    expect((await post({ originalUrl: { $ne: null } })).status).toBe(422);
    expect((await post({ originalUrl: 'https://example.com', userId: '507f1f77bcf86cd799439011' })).status).toBe(422);
  });

  it('supports custom aliases and rejects duplicates', async () => {
    const first = await post({ originalUrl: 'https://example.com/a', customAlias: 'my-alias' });
    expect(first.status).toBe(201);
    expect(first.body.data.url.shortCode).toBe('my-alias');
    const second = await post({ originalUrl: 'https://example.com/b', customAlias: 'my-alias' });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('ALIAS_TAKEN');
  });

  it('rejects reserved and malformed aliases', async () => {
    for (const customAlias of ['api', 'Login', 'dashboard', 'admin', 'ab', 'has space', 'bad/slash', 'x'.repeat(33)]) {
      const res = await post({ originalUrl: 'https://example.com', customAlias });
      expect(res.status, customAlias).toBe(422);
    }
  });

  it('generates unique short codes', async () => {
    const responses = await Promise.all(Array.from({ length: 30 }, () => post({ originalUrl: 'https://example.com/same' })));
    const codes = responses.map((r) => r.body.data.url.shortCode);
    expect(new Set(codes).size).toBe(30);
  });

  it('rejects past expiration dates and accepts future ones', async () => {
    const past = await post({ originalUrl: 'https://example.com', expiresAt: new Date(Date.now() - 60000).toISOString() });
    expect(past.status).toBe(422);
    const invalid = await post({ originalUrl: 'https://example.com', expiresAt: 'tomorrow-ish' });
    expect(invalid.status).toBe(422);
    const future = await post({ originalUrl: 'https://example.com', expiresAt: new Date(Date.now() + 3600000).toISOString() });
    expect(future.status).toBe(201);
    expect(future.body.data.url.expiresAt).toBeTruthy();
  });

  it('rejects oversized bodies', async () => {
    const res = await post({ originalUrl: `https://example.com/${'a'.repeat(20000)}` });
    expect(res.status).toBe(413);
  });
});

describe('public redirects', () => {
  it('redirects a valid short code with 302 and records no analytics', async () => {
    const created = await post({ originalUrl: 'https://example.com/landing?x=1' });
    const { shortCode } = created.body.data.url;
    const res = await request(app).get(`/${shortCode}`).redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/landing?x=1');
    const keys = Object.keys((await Url.findOne({ shortCode })).toObject());
    expect(keys.some((key) => /click|visit|hit|count/i.test(key))).toBe(false);
  });

  it('returns a friendly 404 page for unknown or malformed codes', async () => {
    const unknown = await request(app).get('/doesnotexist').redirects(0);
    expect(unknown.status).toBe(404);
    expect(unknown.headers['content-type']).toMatch(/html/);
    expect(unknown.text).toMatch(/does not exist/i);
    expect((await request(app).get('/bad.code').redirects(0)).status).toBe(404);
  });

  it('does not redirect expired links (410)', async () => {
    await Url.create({ originalUrl: 'https://example.com', shortCode: 'expired1', expiresAt: new Date(Date.now() - 1000) });
    const res = await request(app).get('/expired1').redirects(0);
    expect(res.status).toBe(410);
    expect(res.headers.location).toBeUndefined();
    expect(res.text).toMatch(/expired/i);
  });

  it('does not redirect inactive links (410)', async () => {
    await Url.create({ originalUrl: 'https://example.com', shortCode: 'inactive1', isActive: false });
    const res = await request(app).get('/inactive1').redirects(0);
    expect(res.status).toBe(410);
    expect(res.headers.location).toBeUndefined();
  });

  it('refuses to redirect to a non-http(s) target even if bad data is stored', async () => {
    await Url.collection.insertOne({ originalUrl: 'javascript:alert(1)', shortCode: 'badstore1', isActive: true, expiresAt: null, userId: null });
    const res = await request(app).get('/badstore1').redirects(0);
    expect(res.status).toBe(404);
  });

  it('keeps API routes ahead of the catch-all redirect', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.data.database).toBe('connected');
    const unknownApi = await request(app).get('/api/nothing-here');
    expect(unknownApi.status).toBe(404);
    expect(unknownApi.body.success).toBe(false);
  });
});

describe('links created by logged-in users', () => {
  it('are associated with the user and not anonymous', async () => {
    const { loggedInAgent } = await import('./helpers.js');
    const { agent, userId } = await loggedInAgent();
    const res = await shortenAs(agent, { originalUrl: 'https://example.com/mine' });
    expect(res.status).toBe(201);
    expect(res.body.data.isAnonymous).toBe(false);
    const stored = await Url.findOne({ shortCode: res.body.data.url.shortCode });
    expect(String(stored.userId)).toBe(userId);
  });
});
