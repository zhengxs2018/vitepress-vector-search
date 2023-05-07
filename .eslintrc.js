const { defineConfig } = require('eslint-define-config')

/**
 * eslint config
 * @ref https://eslint.org/
 */
module.exports = defineConfig({
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['import', 'prettier'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2021,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      rules: {
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-confusing-void-expression': 'off',
      },
    },
  ],
})
