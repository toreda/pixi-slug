/**
 * Convert the STIX Two Math TTF into a TypeScript module that exports
 * a Uint8Array. Mirrors `build-fallback-font.mjs` for the body font.
 *
 * Input:  assets/fonts/stix-two-math.ttf
 * Output: src/shared/slug/fonts/fallback/math.ts
 *
 * The font is embedded in full (no subsetting in v1) — see spec
 * `_specs/features/math.md` §7.1. Subsetting via HarfBuzz is a planned
 * follow-up to trim the bundle from ~1.5 MB to ~100 KB.
 */
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const inputPath = resolve(root, 'assets/fonts/stix-two-math.ttf');
if (!existsSync(inputPath)) {
	console.error('[build-math-fallback-font] Font not found at:');
	console.error('  - ' + inputPath);
	console.error('Download from https://github.com/stipub/stixfonts/raw/master/fonts/static_ttf/STIXTwoMath-Regular.ttf');
	process.exit(1);
}

const outPath = resolve(root, 'src/shared/slug/fonts/fallback/math.ts');

const bytes = readFileSync(inputPath);
const sizeKb = (bytes.length / 1024).toFixed(1);

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
// Regenerate via: node scripts/build-math-fallback-font.mjs
// Source: ${relSource}
// Size: ${bytes.length} bytes (~${sizeKb} KB)
// License: SIL Open Font License 1.1 (STIX Two Math) — see examples/OFL_STIXTwoMath.txt

/** Math fallback font bytes (STIX Two Math Regular, full font — not subsetted in v1). */
export const mathStixFallbackBytes: Uint8Array = new Uint8Array([
${chunks.join('\n')}
]);
`;

mkdirSync(dirname(outPath), {recursive: true});
writeFileSync(outPath, content);

const relOut = outPath.slice(root.length + 1).split('\\').join('/');
console.log(`[build-math-fallback-font] wrote ${relOut} (${bytes.length} bytes)`);
