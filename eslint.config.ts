import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs } from '@vue/eslint-config-typescript'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import oxlint from 'eslint-plugin-oxlint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

const config: any = [
  ...defineConfigWithVueTs(
    {
      name: 'app/files-to-lint',
      files: ['**/*.{ts,mts,tsx,vue}'],
    },
    {
      name: 'app/files-to-ignore',
      ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
    },
  ),
  pluginVue.configs['flat/essential'],
  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },
  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  ...oxlint.configs['flat/recommended'],
  skipFormatting,
]

export default config
