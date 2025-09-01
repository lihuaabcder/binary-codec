import path from 'node:path';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Binary Codec',
  description: 'A lightweight TypeScript utility library for working with binary data.',
  base: '/binary-codec/',
  markdown: {
    codeTransformers: [
      transformerTwoslash(
        {
          twoslashOptions: {
            compilerOptions: {
              paths: {
                'binary-codec': [path.resolve(import.meta.dirname, '../../src/index.ts')]
              }
            }
          }
        }
      )
    ],
    languages: ['js', 'jsx', 'ts', 'tsx']
  },
  themeConfig: {
    nav: [
      {
        text: 'Guide',
        link: '/guide/'
      }
      // {
      //   text: 'API Reference',
      //   link: '/api/'
      // }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            {
              text: 'Getting Started',
              link: '/guide/getting-started'
            },
            {
              text: 'Core Concepts',
              link: '/guide/core-concepts'
            }
          ]
        },
        {
          text: 'Basic Types',
          items: [
            {
              text: 'Raw',
              link: '/guide/basic-types/raw'
            },
            {
              text: 'String',
              link: '/guide/basic-types/string'
            },
            {
              text: 'Number',
              link: '/guide/basic-types/number'
            }
          ]
        },
        {
          text: 'Advanced Features',
          items: [
            {
              text: 'Bitset',
              link: '/guide/advanced/bitset'
            },
            {
              text: 'Bitmask',
              link: '/guide/advanced/bitmask'
            },
            {
              text: 'Array',
              link: '/guide/advanced/array'
            },
            {
              text: 'Object',
              link: '/guide/advanced/object'
            }
            // {
            //   text: 'Validation System',
            //   link: '/guide/advanced/validation'
            // }
          ]
        }
      ]
      // '/api/': [
      //   {
      //     text: 'API Reference',
      //     items: [
      //       {
      //         text: 'Overview',
      //         link: '/api/'
      //       },
      //       {
      //         text: 'Codecs',
      //         link: '/api/codecs'
      //       },
      //       {
      //         text: 'Types',
      //         link: '/api/types'
      //       },
      //       {
      //         text: 'Validation',
      //         link: '/api/validation'
      //       }
      //     ]
      //   }
      // ]
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/lihuaabcder/binary-codec'
      }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 lihuaabcder'
    }
  },
  ignoreDeadLinks: true
});
