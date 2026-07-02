import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/db/**/*.test.ts'],
    setupFiles: ['./tests/db/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/db-junit.xml',
    },
  },
});
