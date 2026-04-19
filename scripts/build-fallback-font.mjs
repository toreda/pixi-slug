/**
 * Convert the fallback font TTF into a TypeScript module that exports
 * a Uint8Array. Runs as part of the build so the bundled fallback font
 * is always in sync with the source file.
 *
 * Input:  assets/fonts/roboto-fallback.ttf (or Roboto-Regular-subset.ttf at repo root)
 * Output: src/shared/slug/fonts/fallback/roboto.ts
 */
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const candidates = [
	resolve(root, 'assets/fonts/roboto-fallback.ttf'),
	resolve(root, 'Roboto-Regular-subset.ttf')
];

const inputPath = candidates.find((p) => existsSync(p));
if (!inputPath) {
	console.error('[build-fallback-font] No fallback TTF found. Looked in:');
	for (const p of candidates) console.error('  - ' + p);
	process.exit(1);
}

const outPath = resolve(root, 'src/shared/slug/fonts/fallback/roboto.ts');

const bytes = readFileSync(inputPath);
const sizeKb = (bytes.length / 1024).toFixed(1);

// Emit as a single `new Uint8Array([...])` literal. Base64-decoding at
// runtime would be smaller on disk, but the raw-array form keeps source
// inspection straightforward and avoids a runtime decode step.
const chunks = [];
const lineLength = 24;
for (let i = 0; i < bytes.length; i += lineLength) {
	const line = [];
	const end = Math.min(i + lineLength, bytes.length);
	for (let j = i; j < end; j++) line.push(bytes[j]);
	chunks.push('\t' + line.join(',') + (end < bytes.length ? ',' : ''));
}

const relSource = inputPath.slice(root.length + 1).split('\\').join('/');

const content = `// AUTO-GENERATED — DO NOT EDIT.
// Regenerate via: node scripts/build-fallback-font.mjs
// Source: ${relSource}
// Size: ${bytes.length} bytes (~${sizeKb} KB)
// License: Apache-2.0 (Roboto, Google Fonts)

/** Fallback font bytes (Roboto Regular subset: Basic Latin + Latin-1 Supplement). */
export const robotoFallbackBytes: Uint8Array = new Uint8Array([
${chunks.join('\n')}
]);
`;

mkdirSync(dirname(outPath), {recursive: true});
writeFileSync(outPath, content);

const relOut = outPath.slice(root.length + 1).split('\\').join('/');
console.log(`[build-fallback-font] wrote ${relOut} (${bytes.length} bytes)`);
