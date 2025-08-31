import type { UserConfig } from 'tsdown';
import { defineConfig } from 'tsdown';

const config: UserConfig = defineConfig({
  entry: 'src/index.ts',
  dts: true
});

export default config;
