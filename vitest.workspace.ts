import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'engine',
      environment: 'node',
      globals: true,
      include: [
        'tests/engine/**/*.test.ts',
        'tests/validation/**/*.test.ts',
        'tests/store/**/*.test.ts',
      ],
    },
  },
  {
    test: {
      name: 'components',
      environment: 'jsdom',
      globals: true,
      include: ['tests/components/**/*.test.tsx'],
      setupFiles: ['tests/setup.ts'],
    },
  },
]);
