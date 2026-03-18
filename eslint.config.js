const {FlatCompat} = require('@eslint/eslintrc');
const globals = require('globals');

const compat = new FlatCompat({
	baseDirectory: __dirname
});

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
	{
		ignores: ['dist/**', '.eslintrc.cjs']
	},
	...compat.extends('@toreda/eslint-config'),
	{
		files: ['src/**/*.ts', 'bifrost/src/main/**/*.ts', 'bifrost.src/evts/*.ts'],
		languageOptions: {
			ecmaVersion: 2020
		},
		rules: {
			'@typescript-eslint/no-empty-interface': 'off',
			'@typescript-eslint/explicit-function-return-type': ['warn', {allowExpressions: true}],
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off'
		}
	},
	{
		files: ['src/types/global.d.ts'],
		rules: {
			'no-var': 'off',
			'@typescript-eslint/no-explicit-any': 'off'
		}
	},
	{
		files: ['src/main/run.ts', 'src/main/main.ts'],
		rules: {
			'@typescript-eslint/no-var-requires': 'off',
			'@typescript-eslint/no-require-imports': 'off'
		}
	}
];
