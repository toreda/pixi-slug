import type { Config } from 'jest';

const config: Config = {
	testEnvironment: 'node',
	roots: ['<rootDir>/tests'],
	testMatch: ['**/*.spec.ts'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	transform: {
		'^.+\\.tsx?$': '@swc/jest',
		'^.+\\.m?js$': '@swc/jest'
	},
	transformIgnorePatterns: [
		'/node_modules/(?!@shaderfrog/glsl-parser)'
	],
	coverageDirectory: 'coverage',
	coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/'],
	coverageReporters: ['text-summary', 'lcov'],
	coverageThreshold: {
		global: {
			branches: 60,
			functions: 60,
			lines: 60,
			statements: 60
		}
	}
};

export default config;
