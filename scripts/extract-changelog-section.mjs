#!/usr/bin/env node
// Extract a single version's section from CHANGELOG.md and print it to stdout.
//
// Usage:
//   node scripts/extract-changelog-section.mjs 0.2.0 [path/to/CHANGELOG.md]
//
// Matches the "Keep a Changelog" format used in this repo:
//   ## [0.2.0] - 2026-04-30
//   ...body...
//   ## [0.1.1] - 2026-04-25
//
// Body is the lines between the version heading and the next "## [" heading
// (or EOF). Trailing reference-style link definitions like
// "[0.2.0]: https://github.com/..." are stripped — they belong to the file's
// link table, not the release body.
//
// Exits non-zero if the version isn't found so the workflow fails loudly
// rather than publishing an empty release body.

import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const version = process.argv[2];
const changelogPath = resolve(process.argv[3] ?? 'CHANGELOG.md');

if (!version) {
	console.error('usage: extract-changelog-section.mjs <version> [changelog-path]');
	process.exit(2);
}

const text = readFileSync(changelogPath, 'utf8');
const lines = text.split(/\r?\n/);

const headingRe = new RegExp(`^##\\s*\\[${version.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\]`);
let start = -1;
for (let i = 0; i < lines.length; i++) {
	if (headingRe.test(lines[i])) {
		start = i + 1;
		break;
	}
}

if (start === -1) {
	console.error(`Version ${version} not found in ${changelogPath}`);
	process.exit(1);
}

let end = lines.length;
for (let i = start; i < lines.length; i++) {
	if (/^##\s*\[/.test(lines[i])) {
		end = i;
		break;
	}
}

const body = lines
	.slice(start, end)
	.filter((line) => !/^\[[^\]]+\]:\s*https?:\/\//.test(line))
	.join('\n')
	.trim();

if (body.length === 0) {
	console.error(`Version ${version} section is empty in ${changelogPath}`);
	process.exit(1);
}

process.stdout.write(body + '\n');
