import js from '@eslint/js'
import security from 'eslint-plugin-security'

export default [
    js.configs.recommended,
    security.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                document: 'readonly',
                window: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': ['error', 'always'],
            'security/detect-object-injection': 'off',
            'security/detect-non-literal-regexp': 'off',
        }
    },
    {
        ignores: ['dist/**', 'node_modules/**', 'scripts/**', 'coverage/**', 'reports/**', 'audit/**']
    }
]
