import type { UserConfig } from 'vitest/node';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'binary-codec': resolve('src/index.ts')
    }
  },
  test: {
    include: [
      './tests/*.{test,spec}.?(c|m)[jt]s?(x)',
      './tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ],
    exclude: ['./tests/helper.ts']
  }
}) as UserConfig;
