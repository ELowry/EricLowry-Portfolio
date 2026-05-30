import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import prettier from 'eslint-config-prettier';

export default [
	{
		ignores: ['dist/**', 'node_modules/**', 'public/**'],
	},
	{
		files: ['public/content/blog-index.json'],
	},
	js.configs.recommended,
	jsdoc.configs['flat/recommended'],
	{
		files: ['**/*.js', '**/*.mjs'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			curly: ['error', 'all'],
			eqeqeq: ['error', 'always', { null: 'ignore' }],
			'no-empty': ['error', { allowEmptyCatch: true }],
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					caughtErrors: 'none',
				},
			],
			'no-useless-assignment': 'warn',

			'jsdoc/check-types': 'off',
			'jsdoc/no-defaults': 'off',
			'jsdoc/no-undefined-types': 'off',
			'jsdoc/reject-any-type': 'off',
			'jsdoc/reject-function-type': 'off',
			'jsdoc/tag-lines': 'off',
			'jsdoc/check-tag-names': ['warn', { definedTags: ['constant'] }],
			'jsdoc/require-jsdoc': [
				'warn',
				{
					publicOnly: false,
					require: {
						ArrowFunctionExpression: false,
						ClassDeclaration: true,
						ClassExpression: true,
						FunctionDeclaration: true,
						FunctionExpression: false,
						MethodDefinition: true,
					},
					checkGetters: 'no-setter',
					checkSetters: false,
				},
			],
			'jsdoc/require-description': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-returns': 'warn',
			'jsdoc/require-returns-description': 'warn',
		},
	},
	{
		files: ['**/*.test.js'],
		rules: {
			'jsdoc/require-jsdoc': 'off',
		},
	},
	prettier,
];
