import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { Url } from '../models/Url.js';
import { User } from '../models/User.js';

let memoryServer;

beforeAll(async () => {
  let uri = process.env.MONGODB_URI_TEST;
  if (uri) {
    // Safety net: tests delete every document, so only ever run against a database named "*test*".
    const dbName = new URL(uri).pathname.replace('/', '');
    if (!/test/i.test(dbName)) throw new Error('MONGODB_URI_TEST must point to a database whose name contains "test".');
  } else {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  await mongoose.connect(uri);
  await Promise.all([User.init(), Url.init()]);
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Url.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});
