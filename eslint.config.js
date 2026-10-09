// @ts-check
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'referencia/',
      'playwright-report/',
      'test-results/',
      'public/admin/cms/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  // Reglas de accesibilidad para el marcado de los componentes .astro.
  ...astro.configs['jsx-a11y-strict'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // gtag.js de Google necesita el objeto `arguments` (no admite parámetros rest)
    files: ['src/components/layout/Analitica.astro', 'src/components/layout/Analitica.astro/**'],
    rules: { 'prefer-rest-params': 'off' },
  },
);
