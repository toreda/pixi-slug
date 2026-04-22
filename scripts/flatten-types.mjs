#!/usr/bin/env node
// Flattens tsc's nested declaration output for each version so .d.ts files
// sit next to the webpack-bundled index.js:
//   dist/v8/v8/*  -> dist/v8/*
// Then strips one leading '../' from imports of '../shared/' and '../defaults'
// so the relative paths still resolve after the move.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const VERSIONS = ['v6', 'v7', 'v8'];

for (const version of VERSIONS) {
	const versionDir = path.join(ROOT, 'dist', version);
	const nestedDir = path.join(versionDir, version);
	if (!fs.existsSync(nestedDir)) continue;

	for (const entry of fs.readdirSync(nestedDir, {withFileTypes: true})) {
		const src = path.join(nestedDir, entry.name);
		const dest = path.join(versionDir, entry.name);
		fs.rmSync(dest, {recursive: true, force: true});
		fs.renameSync(src, dest);
	}
	fs.rmdirSync(nestedDir);

	rewriteTree(versionDir, versionDir);
}

function rewriteTree(dir, versionDir) {
	for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			// Skip the sibling 'shared' tree — those files still live at their
			// original depth and their internal relative paths are unchanged.
			if (dir === versionDir && (entry.name === 'shared')) continue;
			rewriteTree(full, versionDir);
			continue;
		}
		if (entry.name.endsWith('.d.ts') || entry.name.endsWith('.d.ts.map')) {
			rewriteFile(full);
		}
	}
}

function rewriteFile(file) {
	const src = fs.readFileSync(file, 'utf8');
	let out = src
		.replace(/(['"])((?:\.\.\/)+)shared\//g, (_m, q, ups) => `${q}${stripOne(ups)}shared/`)
		.replace(/(['"])((?:\.\.\/)+)defaults(?=['"])/g, (_m, q, ups) => `${q}${stripOne(ups)}defaults`);
	if (file.endsWith('.d.ts.map')) {
		out = out.replace(/(['"])((?:\.\.\/)+)src\//g, (_m, q, ups) => `${q}${stripOne(ups)}src/`);
	}
	if (out !== src) fs.writeFileSync(file, out);
}

function stripOne(ups) {
	const next = ups.slice(3);
	return next === '' ? './' : next;
}
