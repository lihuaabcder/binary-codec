import type { EnhanceAppContext } from 'vitepress';
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client';
import DefaultTheme from 'vitepress/theme';
import '@shikijs/vitepress-twoslash/style.css';

export default {
  extends: DefaultTheme,
  enhanceApp(ctx: EnhanceAppContext) {
    ctx.app.use(TwoslashFloatingVue);
  }
};
