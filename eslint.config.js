// Lint vid sidan av fallow (komplexitet/död kod) och tsc (typer): ESLint tar
// buggmönster, hook-regler och tillgänglighet i JSX.
import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/', 'dev-dist/', 'data/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Sökskärmen fokuserar fältet avsiktligt (hela skärmen är sök).
      // Omprövas i tillgänglighetsgranskningen (roadmap fas 11).
      'jsx-a11y/no-autofocus': 'off',
    },
  },
)
