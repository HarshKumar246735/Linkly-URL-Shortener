import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { config, validateEnv } from './config/env.js';
import { Url } from './models/Url.js';
import { User } from './models/User.js';

async function start() {
  validateEnv();
  await connectDB(config.mongodbUri);

  // Make sure the unique indexes exist before accepting traffic.
  await Promise.all([User.init(), Url.init()]);

  const server = app.listen(config.port, () => {
    console.log(`Linkly API listening on port ${config.port} (${config.nodeEnv})`);
    console.log(`Short links use base URL ${config.baseUrl}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason instanceof Error ? reason.message : reason);
});

start().catch((error) => {
  // The message never contains the connection string or secrets.
  console.error('Failed to start Linkly API:', error.message);
  process.exit(1);
});
