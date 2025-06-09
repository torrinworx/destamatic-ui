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

// todo: dual test system, one that tests form the source, and another that tests
// from the dist resulting from vite build. we should map destamatic-ui imports in the
// tests to the ./dist/index.js, so that might mean changing/loading two different vite
// configs or doing something withhere iwth vitest? idk. would be nice to verify on 
// npm push that the build works.
