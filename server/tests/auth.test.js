import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import { User } from '../models/User.js';
import { CSRF, loggedInAgent, makeUser } from './helpers.js';

describe('authentication', () => {
  it('registers a user, sets an HttpOnly cookie and never returns the password hash', async () => {
    const user = makeUser();
    const res = await request(app).post('/api/auth/register').set(CSRF).send(user);

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(user.email);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/linkly_token=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('stores passwords hashed with bcrypt', async () => {
    const user = makeUser();
    await request(app).post('/api/auth/register').set(CSRF).send(user);
    const stored = await User.findOne({ email: user.email }).select('+passwordHash');
    expect(stored.passwordHash).not.toBe(user.password);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects duplicate registration (case-insensitive email)', async () => {
    const user = makeUser();
    await request(app).post('/api/auth/register').set(CSRF).send(user);
    const res = await request(app).post('/api/auth/register').set(CSRF).send({ ...user, email: user.email.toUpperCase() });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('validates registration input', async () => {
    const res = await request(app).post('/api/auth/register').set(CSRF).send({ name: 'A', email: 'nope', password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('rejects NoSQL-injection style payloads', async () => {
    const res = await request(app).post('/api/auth/login').set(CSRF).send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(422);
  });

  it('logs in with valid credentials', async () => {
    const user = makeUser();
    await request(app).post('/api/auth/register').set(CSRF).send(user);
    const res = await request(app).post('/api/auth/login').set(CSRF).send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].join(';')).toMatch(/linkly_token=/);
  });

  it('rejects wrong passwords and unknown emails with the same generic message', async () => {
    const user = makeUser();
    await request(app).post('/api/auth/register').set(CSRF).send(user);
    const wrongPassword = await request(app).post('/api/auth/login').set(CSRF).send({ email: user.email, password: 'WrongPass1' });
    const unknownEmail = await request(app).post('/api/auth/login').set(CSRF).send({ email: 'ghost@example.com', password: 'WrongPass1' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it('returns the current user and logs out by clearing the cookie', async () => {
    const { agent, user } = await loggedInAgent();
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(user.email);

    const out = await agent.post('/api/auth/logout').set(CSRF);
    expect(out.status).toBe(200);
    expect(out.headers['set-cookie'].join(';')).toMatch(/linkly_token=;/);

    const after = await agent.get('/api/auth/me');
    expect(after.status).toBe(401);
  });

  it('protects private endpoints from unauthenticated requests', async () => {
    expect((await request(app).get('/api/urls')).status).toBe(401);
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).patch('/api/urls/507f1f77bcf86cd799439011').set(CSRF).send({ isActive: false })).status).toBe(401);
  });

  it('rejects cookie-authenticated writes without the CSRF header and from foreign origins', async () => {
    const { agent } = await loggedInAgent();
    const noHeader = await agent.post('/api/urls/shorten').send({ originalUrl: 'https://example.com' });
    expect(noHeader.status).toBe(403);
    const badOrigin = await agent.post('/api/urls/shorten').set(CSRF).set('Origin', 'https://evil.example').send({ originalUrl: 'https://example.com' });
    expect(badOrigin.status).toBe(403);
  });

  it('answers CORS preflight for the configured client origin only', async () => {
    const allowed = await request(app).options('/api/auth/login').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'POST');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    const denied = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(denied.status).toBe(403);
  });
});
