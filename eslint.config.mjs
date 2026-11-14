// ESLint flat config (ESLint 9/10). Replaces the legacy .eslintrc.json, which
// ESLint 10 no longer reads.
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    {
        // The legacy config restricted linting to TypeScript via `--ext ts`.
        // Keep the webview JS out of scope to match.
        ignores: ['out/**', 'dist/**', '**/*.d.ts', '**/*.js'],
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 6,
            sourceType: 'module',
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    selector: 'import',
                    format: ['camelCase', 'PascalCase'],
                },
            ],
            curly: 'warn',
            eqeqeq: 'warn',
            'no-throw-literal': 'warn',
            semi: 'off',
        },
    },
];
