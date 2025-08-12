import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'tests/setup.ts',
        'tests/mocks/**',
        'src/types/**',
      ],
    },
    // Chrome extension specific test settings
    testTimeout: 10000,
    hookTimeout: 5000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@application': path.resolve(__dirname, 'src/application'),
      '@ui': path.resolve(__dirname, 'src/ui'),
    },
  },
});
