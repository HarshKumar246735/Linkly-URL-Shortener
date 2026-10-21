import { describe, expect, it } from 'vitest';
import { Url } from '../models/Url.js';
import { CSRF, loggedInAgent, shortenAs } from './helpers.js';

async function setup() {
  const alice = await loggedInAgent({ name: 'Alice' });
  const bob = await loggedInAgent({ name: 'Bob' });
  const aliceLink = (await shortenAs(alice.agent, { originalUrl: 'https://example.com/alice', customAlias: 'alice-link' })).body.data.url;
  const bobLink = (await shortenAs(bob.agent, { originalUrl: 'https://example.com/bob', customAlias: 'bob-link' })).body.data.url;
  return { alice, bob, aliceLink, bobLink };
}

describe('ownership', () => {
  it('lists only the current user’s links', async () => {
    const { alice } = await setup();
    const res = await alice.agent.get('/api/urls');
    expect(res.status).toBe(200);
    expect(res.body.data.urls.map((u) => u.shortCode)).toEqual(['alice-link']);
    expect(res.body.data.pagination.total).toBe(1);
  });

  it('does not list anonymous links in any dashboard', async () => {
    const { alice } = await setup();
    await Url.create({ originalUrl: 'https://example.com/anon', shortCode: 'anon-link' });
    const res = await alice.agent.get('/api/urls');
    expect(res.body.data.pagination.total).toBe(1);
  });

  it('lets the owner read a link', async () => {
    const { alice, aliceLink } = await setup();
    const res = await alice.agent.get(`/api/urls/${aliceLink.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.url.shortCode).toBe('alice-link');
  });

  it('hides other users’ links (404, not 200)', async () => {
    const { alice, bobLink } = await setup();
    const res = await alice.agent.get(`/api/urls/${bobLink.id}`);
    expect(res.status).toBe(404);
  });

  it('prevents editing another user’s link', async () => {
    const { alice, bobLink } = await setup();
    const res = await alice.agent.patch(`/api/urls/${bobLink.id}`).set(CSRF).send({ originalUrl: 'https://evil.example', isActive: false });
    expect(res.status).toBe(404);
    const stored = await Url.findById(bobLink.id);
    expect(stored.originalUrl).toBe('https://example.com/bob');
    expect(stored.isActive).toBe(true);
  });

  it('prevents deleting another user’s link', async () => {
    const { alice, bobLink } = await setup();
    const res = await alice.agent.delete(`/api/urls/${bobLink.id}`).set(CSRF);
    expect(res.status).toBe(404);
    expect(await Url.findById(bobLink.id)).not.toBeNull();
  });

  it('lets the owner update, deactivate, reactivate and delete', async () => {
    const { alice, aliceLink } = await setup();
    const edit = await alice.agent.patch(`/api/urls/${aliceLink.id}`).set(CSRF).send({ originalUrl: 'https://example.com/new', shortCode: 'renamed1' });
    expect(edit.status).toBe(200);
    expect(edit.body.data.url.shortCode).toBe('renamed1');
    expect(edit.body.data.url.originalUrl).toBe('https://example.com/new');

    const off = await alice.agent.patch(`/api/urls/${aliceLink.id}`).set(CSRF).send({ isActive: false });
    expect(off.body.data.url.status).toBe('inactive');
    const on = await alice.agent.patch(`/api/urls/${aliceLink.id}`).set(CSRF).send({ isActive: true });
    expect(on.body.data.url.status).toBe('active');

    const del = await alice.agent.delete(`/api/urls/${aliceLink.id}`).set(CSRF);
    expect(del.status).toBe(204);
    expect(await Url.findById(aliceLink.id)).toBeNull();
  });

  it('rejects alias collisions and invalid updates', async () => {
    const { alice, aliceLink } = await setup();
    await shortenAs(alice.agent, { originalUrl: 'https://example.com/2', customAlias: 'second-link' });
    const clash = await alice.agent.patch(`/api/urls/${aliceLink.id}`).set(CSRF).send({ shortCode: 'second-link' });
    expect(clash.status).toBe(409);
    expect((await alice.agent.patch(`/api/urls/${aliceLink.id}`).set(CSRF).send({ originalUrl: 'javascript:alert(1)' })).status).toBe(422);
    expect((await alice.agent.patch(`/api/urls/${aliceLink.id}`).set(CSRF).send({})).status).toBe(422);
    expect((await alice.agent.patch(`/api/urls/${aliceLink.id}`).set(CSRF).send({ userId: '507f1f77bcf86cd799439011' })).status).toBe(422);
  });

  it('blocks reactivating an expired link until the expiration is changed', async () => {
    const { alice, aliceLink } = await setup();
    await Url.updateOne({ _id: aliceLink.id }, { isActive: false, expiresAt: new Date(Date.now() - 1000) });
    const blocked = await alice.agent.patch(`/api/urls/${aliceLink.id}`).set(CSRF).send({ isActive: true });
    expect(blocked.status).toBe(422);
    const future = new Date(Date.now() + 3600000).toISOString();
    const ok = await alice.agent.patch(`/api/urls/${aliceLink.id}`).set(CSRF).send({ isActive: true, expiresAt: future });
    expect(ok.status).toBe(200);
    expect(ok.body.data.url.status).toBe('active');
  });

  it('supports search, status filter and pagination', async () => {
    const { alice } = await setup();
    for (let i = 0; i < 4; i += 1) await shortenAs(alice.agent, { originalUrl: `https://shop.example.com/item/${i}` });
    await Url.updateOne({ shortCode: 'alice-link' }, { isActive: false });

    const search = await alice.agent.get('/api/urls').query({ search: 'shop.example' });
    expect(search.body.data.pagination.total).toBe(4);
    const inactive = await alice.agent.get('/api/urls').query({ status: 'inactive' });
    expect(inactive.body.data.urls.map((u) => u.shortCode)).toEqual(['alice-link']);
    const paged = await alice.agent.get('/api/urls').query({ limit: 2, page: 2 });
    expect(paged.body.data.urls).toHaveLength(2);
    expect(paged.body.data.pagination.totalPages).toBe(3);
    expect((await alice.agent.get('/api/urls').query({ status: 'bogus' })).status).toBe(422);
  });
});
