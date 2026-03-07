// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier/flat');
import pluginQuery from '@tanstack/eslint-plugin-query';

module.exports = defineConfig([
  ...pluginQuery.configs['flat/recommended'],
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  eslintConfigPrettier,
]);
