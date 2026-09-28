#!/usr/bin/env node
// Runs after flatten-types.mjs. For each version with declarations in
// dist/<v>/esm/:
//   1. Adds explicit '.js' extensions to relative specifiers in .d.ts files.
//      Node's ESM resolver (and TypeScript's node16/nodenext resolution for
//      declarations under a "type": "module" package.json) requires them;
//      tsc emits specifiers exactly as written in source.
//   2. Copies the .d.ts / .d.ts.map tree into dist/<v>/cjs/ so the `require`
//      export condition has its own declarations. Explicit extensions are
//      valid for CJS declarations too, so the same files serve both.
//   3. Writes a package.json {"type": ...} marker into each format dir so the
//      declarations are interpreted as the right module system even when only
//      types were built (webpack writes the same markers next to the bundles).

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const VERSIONS = ['v6', 'v7', 'v8'];
const MODULE_TYPES = {cjs: 'commonjs', esm: 'module'};

for (const version of VERSIONS) {
	const esmDir = path.join(ROOT, 'dist', version, 'esm');
	const cjsDir = path.join(ROOT, 'dist', version, 'cjs');
	if (!fs.existsSync(path.join(esmDir, 'index.d.ts'))) continue;

	addJsExtensions(esmDir);
	copyDeclarations(esmDir, cjsDir);

	for (const [format, type] of Object.entries(MODULE_TYPES)) {
		const dir = path.join(ROOT, 'dist', version, format);
		fs.mkdirSync(dir, {recursive: true});
		fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({type}, null, '\t') + '\n');
	}
}

function addJsExtensions(dir) {
	for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			addJsExtensions(full);
			continue;
		}
		if (!entry.name.endsWith('.d.ts')) continue;

		const src = fs.readFileSync(full, 'utf8');
		const out = src.replace(
			// Also matches bare '.' / '..', which tsc emits for inferred
			// types, e.g. `import("..").SlugFillResolved`.
			/(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.\.?(?:\/[^'"]*)?)\2/g,
			(_m, lead, q, spec) => `${lead}${q}${resolveSpecifier(dir, spec)}${q}`
		);
		if (out !== src) fs.writeFileSync(full, out);
	}
}

function resolveSpecifier(fromDir, spec) {
	if (/\.(js|mjs|cjs|json)$/.test(spec)) return spec;

	const target = path.resolve(fromDir, spec);
	if (fs.existsSync(`${target}.d.ts`)) return `${spec}.js`;
	if (fs.existsSync(path.join(target, 'index.d.ts'))) return `${spec.replace(/\/$/, '')}/index.js`;
	throw new Error(`finalize-types: cannot resolve '${spec}' from ${path.relative(ROOT, fromDir)}`);
}

function copyDeclarations(srcDir, destDir) {
	fs.mkdirSync(destDir, {recursive: true});
	for (const entry of fs.readdirSync(srcDir, {withFileTypes: true})) {
		const from = path.join(srcDir, entry.name);
		const to = path.join(destDir, entry.name);
		if (entry.isDirectory()) {
			copyDeclarations(from, to);
		} else if (entry.name.endsWith('.d.ts') || entry.name.endsWith('.d.ts.map')) {
			fs.copyFileSync(from, to);
		}
	}
}
