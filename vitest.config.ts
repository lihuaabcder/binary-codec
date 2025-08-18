import type { UserConfig } from 'vitest/node';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      './tests/*.{test,spec}.?(c|m)[jt]s?(x)',
      './tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ],
    exclude: ['./tests/helper.ts']
  }
}) as UserConfig;
