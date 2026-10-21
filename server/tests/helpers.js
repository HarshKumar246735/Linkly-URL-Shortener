import request from 'supertest';
import app from '../app.js';

export const CSRF = { 'X-Requested-With': 'XMLHttpRequest' };

let counter = 0;
export const makeUser = (overrides = {}) => {
  counter += 1;
  return { name: 'Test User', email: `user${counter}@example.com`, password: 'Passw0rdOK', ...overrides };
};

/** Registers a user and returns a supertest agent that carries the auth cookie. */
export async function loggedInAgent(overrides = {}) {
  const agent = request.agent(app);
  const user = makeUser(overrides);
  const res = await agent.post('/api/auth/register').set(CSRF).send(user);
  if (res.status !== 201) throw new Error(`Registration failed in test helper: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user, userId: res.body.data.user.id };
}

export const shortenAs = (agent, body) => agent.post('/api/urls/shorten').set(CSRF).send(body);
