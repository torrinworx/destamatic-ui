import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import baseViteConfig from './vite.config.js'

export default mergeConfig(
  baseViteConfig,
  defineConfig({
    root: '.',
    test: {
      environment: 'jsdom',
      setupFiles: ['document.js'],
      include: ['components/**/*.test.{js,ts,jsx,tsx}', 'components/**/*.spec.{js,ts,jsx,tsx}'],
    },
  }),
);
