import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
      CLIENT_URL: 'http://localhost:5173',
      BASE_URL: 'http://localhost:5000',
    },
  },
});
