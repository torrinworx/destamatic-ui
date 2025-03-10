import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import baseViteConfig from './vite.config.js'

export default mergeConfig(
  baseViteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/document.js'],
      include: ['tests/**/*.test.{js,ts,jsx,tsx}', 'tests/**/*.spec.{js,ts,jsx,tsx}'],
    },
  })
);
