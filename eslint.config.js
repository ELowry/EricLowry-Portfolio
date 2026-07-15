import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import prettier from 'eslint-config-prettier';

export default [
	{
		ignores: [
			'dist/**',
			'node_modules/**',
			'public/.obsidian/**',
			'public/obsidian/**',
			'public/assets/**',
			'!public/assets/external-links.json',
			'package-lock.json',
		],
	},
	// JAVASCRIPT
	{
		files: ['**/*.js', '**/*.mjs', '**/*.md/*.js', '**/*.md/*.mjs'],
		...js.configs.recommended,
	},
	{
		files: ['**/*.js', '**/*.mjs', '**/*.md/*.js', '**/*.md/*.mjs'],
		...jsdoc.configs['flat/recommended'],
	},
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
			'jsdoc/require-returns': 'warn',
			'jsdoc/require-returns-description': 'warn',
		},
	},
	{
		files: ['**/*.json'],
		language: 'json/json',
		...json.configs.recommended,
	},
	// MARKDOWN
	...markdown.configs.recommended,
	{
		files: ['**/*.md'],
		language: 'markdown/gfm',
		rules: {
			'markdown/heading-increment': 'off',
			'markdown/no-html': 'off',
			'markdown/no-bare-urls': 'warn',
			'markdown/no-duplicate-headings': 'warn',
			'markdown/no-missing-label-refs': 'off',
			'markdown/fenced-code-language': 'off',
		},
	},
	// Scripts inside Markdown files
	{
		files: ['**/*.md/*.js', '**/*.md/*.mjs'],
		rules: {
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'no-console': 'off',
			'jsdoc/require-jsdoc': 'off',
		},
	},
	// TEST FILES
	{
		files: ['**/*.test.js'],
		rules: {
			'jsdoc/require-jsdoc': 'off',
		},
	},
	// PRETTIER
	prettier,
];
