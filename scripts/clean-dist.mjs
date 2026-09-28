#!/usr/bin/env node
// Removes build output before a build so stale files (e.g. from an older dist
// layout) can't end up in the published package.
//
// Usage:
//   node scripts/clean-dist.mjs <v6|v7|v8|all>

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const VERSIONS = ['v6', 'v7', 'v8'];
const target = process.argv[2];

if (target === 'all') {
	fs.rmSync(path.join(ROOT, 'dist'), {recursive: true, force: true});
} else if (VERSIONS.includes(target)) {
	fs.rmSync(path.join(ROOT, 'dist', target), {recursive: true, force: true});
} else {
	console.error(`clean-dist: expected one of ${[...VERSIONS, 'all'].join(', ')}; got '${target ?? ''}'`);
	process.exit(1);
}
