#!/usr/bin/env node
// Build all bundles and copy examples + dist to docs/ for GitHub Pages.
// Run from project root: node scripts/build-docs.js

'use strict';

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

// Always resolve paths relative to the project root (one level up from scripts/).
const ROOT = path.resolve(__dirname, '..');

function run(cmd) {
	console.log('> ' + cmd);
	execSync(cmd, {stdio: 'inherit', cwd: ROOT});
}

function mkdirp(dir) {
	fs.mkdirSync(path.join(ROOT, dir), {recursive: true});
}

function cp(src, dest) {
	try {
		fs.copyFileSync(path.join(ROOT, src), path.join(ROOT, dest));
	} catch (e) {
		if (e.code !== 'ENOENT') throw e;
		// silently skip missing optional files (e.g. font.ttf)
	}
}

// Recursively copy a directory. Used for _shared/ and assets/ which
// each contain a small fixed set of files we want to mirror into docs/.
function cpDir(src, dest) {
	const absSrc = path.join(ROOT, src);
	const absDest = path.join(ROOT, dest);
	if (!fs.existsSync(absSrc)) return;
	fs.mkdirSync(absDest, {recursive: true});
	for (const entry of fs.readdirSync(absSrc, {withFileTypes: true})) {
		const from = path.join(src, entry.name);
		const to = path.join(dest, entry.name);
		if (entry.isDirectory()) {
			cpDir(from, to);
		} else if (entry.isFile()) {
			cp(from, to);
		}
	}
}

function sedReplace(file, from, to) {
	const abs = path.join(ROOT, file);
	const content = fs.readFileSync(abs, 'utf8');
	fs.writeFileSync(abs, content.split(from).join(to), 'utf8');
}

try {
	// ----- Build -----
	console.log('Building all versions...');
	run('pnpm exec webpack --config webpack.config.ts --env version=v6 --env target=prod');
	run('pnpm exec webpack --config webpack.config.ts --env version=v7 --env target=prod');
	run('pnpm exec webpack --config webpack.config.ts --env version=v8 --env target=prod');

	// ----- Clean & create dirs -----
	console.log('Cleaning docs/...');
	fs.rmSync(path.join(ROOT, 'docs'), {recursive: true, force: true});
	for (const dir of [
		'docs/dist/v6',
		'docs/dist/v7',
		'docs/dist/v8',
		'docs/v6',
		'docs/v7',
		'docs/v8',
		'docs/comparison',
		'docs/benchmark'
	]) {
		mkdirp(dir);
	}

	// ----- Copy bundles -----
	console.log('Copying bundles...');
	cp('dist/v6/index.js', 'docs/dist/v6/index.js');
	cp('dist/v7/index.js', 'docs/dist/v7/index.js');
	cp('dist/v8/index.js', 'docs/dist/v8/index.js');

	// ----- Copy examples -----
	console.log('Copying examples...');
	cp('examples/v6/index.html', 'docs/v6/index.html');
	cp('examples/v6/font.ttf', 'docs/v6/font.ttf');
	cp('examples/v7/index.html', 'docs/v7/index.html');
	cp('examples/v7/font.ttf', 'docs/v7/font.ttf');
	cp('examples/v8/index.html', 'docs/v8/index.html');
	cp('examples/v8/font.ttf', 'docs/v8/font.ttf');
	cp('examples/comparison/index.html', 'docs/comparison/index.html');
	cp('examples/comparison/font.ttf', 'docs/comparison/font.ttf');
	cp('examples/benchmark/index.html', 'docs/benchmark/index.html');

	// ----- Copy shared sidebar + bundled fonts -----
	// _shared/ holds sidebar.html, sidebar.css, and wire.js which the
	// per-version pages load via `../_shared/...`. Mirroring it next to
	// the v6/v7/v8 directories keeps those relative paths working under
	// the /pixi-slug/ project subpath that GitHub Pages serves at.
	console.log('Copying _shared/ and assets/...');
	cpDir('examples/_shared', 'docs/_shared');
	cpDir('assets', 'docs/assets');

	// ----- Fix paths -----
	console.log('Fixing paths in docs/...');
	sedReplace('docs/v6/index.html', '../../dist/v6/index.js', '../dist/v6/index.js');
	sedReplace('docs/v7/index.html', '../../dist/v7/index.js', '../dist/v7/index.js');
	sedReplace('docs/v8/index.html', '../../dist/v8/index.js', '../dist/v8/index.js');
	sedReplace('docs/comparison/index.html', '../../dist/v8/index.js', '../dist/v8/index.js');
	sedReplace('docs/benchmark/index.html', '../../dist/v8/index.js', '../dist/v8/index.js');

	// wire.js references the bundled fallback fonts at `/assets/fonts/...`
	// (absolute) which only resolves when the site is served at the
	// domain root. On Pages we re-root them to `../assets/fonts/...`
	// since wire.js lives at docs/_shared/ and assets at docs/assets/.
	sedReplace('docs/_shared/wire.js', "'/assets/fonts/", "'../assets/fonts/");

	// Fix nav links: /examples/X/ → ../X/ so they work on GitHub Pages
	// where the base path is /pixi-slug/, not /.
	for (const page of [
		'docs/v6/index.html',
		'docs/v7/index.html',
		'docs/v8/index.html',
		'docs/comparison/index.html',
		'docs/benchmark/index.html'
	]) {
		sedReplace(page, '/examples/', '../');
	}

	// ----- Write docs/index.html -----
	console.log('Creating docs/index.html...');
	fs.writeFileSync(
		path.join(ROOT, 'docs/index.html'),
		`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>pixi-slug — Examples</title>
	<style>
		body { font-family: sans-serif; max-width: 600px; margin: 40px auto; color: #333; }
		h1 { margin-bottom: 8px; }
		p { color: #666; margin-bottom: 24px; }
		a { display: block; padding: 12px 16px; margin: 8px 0; background: #f0f0f0; border-radius: 6px; text-decoration: none; color: #16213e; }
		a:hover { background: #e0e0f0; }
		small { color: #999; }
	</style>
</head>
<body>
	<h1>pixi-slug Examples</h1>
	<p>GPU-accelerated text rendering for PixiJS using the Slug algorithm.</p>
	<a href="comparison/">Live Rendering Comparison <small>— pixi-slug vs Text vs BitmapText</small></a>
	<a href="benchmark/">Benchmark</a>
	<a href="v8/">PixiJS v8 Example</a>
	<a href="v7/">PixiJS v7 Example</a>
	<a href="v6/">PixiJS v6 Example</a>
</body>
</html>
`,
		'utf8'
	);

	// ----- Write docs/.nojekyll -----
	// GitHub Pages runs Jekyll by default, which strips paths starting
	// with `_` (e.g. docs/_shared/). The presence of .nojekyll disables
	// Jekyll so files are served as-is. Must be re-created here because
	// the docs/ rmSync above wipes it on every build.
	console.log('Creating docs/.nojekyll...');
	fs.writeFileSync(path.join(ROOT, 'docs/.nojekyll'), '', 'utf8');

	console.log('Done. docs/ is ready for GitHub Pages.');
	console.log('Configure GitHub Pages to serve from /docs on the main branch.');
} catch (e) {
	console.error('build-docs failed:', e.message);
	process.exit(1);
}
