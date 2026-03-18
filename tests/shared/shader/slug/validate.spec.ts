import fs from 'fs';
import path from 'path';
import { parse } from '@shaderfrog/glsl-parser';

const SHADER_DIR = path.resolve(__dirname, '../../../../src/shared/shader/slug');

describe('GLSL shader validation', () => {
	const shaderFiles = fs
		.readdirSync(SHADER_DIR)
		.filter((file) => file.endsWith('.glsl'));

	it('should find shader files to validate', () => {
		expect(shaderFiles.length).toBeGreaterThan(0);
	});

	for (const file of shaderFiles) {
		const filePath = path.join(SHADER_DIR, file);
		const stage = file.includes('vert') ? 'vertex' : 'fragment';

		describe(file, () => {
			it(`should parse as valid GLSL ES 3.00 (${stage})`, () => {
				const source = fs.readFileSync(filePath, 'utf-8');
				expect(() => {
					parse(source, { stage, quiet: true });
				}).not.toThrow();
			});

			it('should contain a #version 300 es directive', () => {
				const source = fs.readFileSync(filePath, 'utf-8');
				expect(source).toMatch(/^#version\s+300\s+es/m);
			});

			it('should contain a main() function', () => {
				const source = fs.readFileSync(filePath, 'utf-8');
				expect(source).toMatch(/void\s+main\s*\(\s*\)/);
			});
		});
	}
});
