#!/usr/bin/env node
// Prepare CHANGELOG.md for a release without touching any release notes.
//
// Two operations only:
//   1. If the topmost release heading is `## [Unreleased]` (and the next one
//      below it is NOT already `## [<version>]`), rename the heading to
//      `## [<version>] - <YYYY-MM-DD>`. Date is today in UTC.
//   2. Update the reference-link block at the bottom:
//        [Unreleased]: <repo>/compare/v<version>...HEAD
//        [<version>]:  <repo>/compare/v<prev>...v<version>     (if a previous
//                                                               version exists)
//        [<version>]:  <repo>/releases/tag/v<version>          (first release)
//      Existing link lines for older versions are kept verbatim.
//
// What it does NOT do:
//   - Touch any body content under any heading.
//   - Bump package.json version (assumed already updated by the human).
//   - Validate that `version` is the semver-correct next bump — that's a
//     judgment call. The script only emits warnings in suspicious cases:
//       * package.json#version doesn't match the requested version
//       * the requested version is not greater than the previous version
//         under simple lexical-numeric comparison
//   - Add a new heading if `[Unreleased]` is missing — that's a different
//     workflow (re-releasing or re-tagging) and out of scope here.
//
// Usage:
//   node scripts/prepare-changelog-release.mjs <version> [--repo <url>] [--changelog <path>]
//
// Repo URL: defaults to deriving from $GITHUB_REPOSITORY ("owner/name") or
// falls back to scanning the existing CHANGELOG link block for a github.com
// URL. Pass --repo to override.

import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

function parseArgs(argv) {
	const args = {positional: []};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--repo') args.repo = argv[++i];
		else if (a === '--changelog') args.changelog = argv[++i];
		else if (a === '--help' || a === '-h') args.help = true;
		else args.positional.push(a);
	}
	return args;
}

function todayUtcDate() {
	// YYYY-MM-DD in UTC, no time component.
	const d = new Date();
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function semverTuple(v) {
	const m = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(v);
	if (!m) return null;
	return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemver(a, b) {
	const ta = semverTuple(a),
		tb = semverTuple(b);
	if (!ta || !tb) return null;
	for (let i = 0; i < 3; i++) {
		if (ta[i] !== tb[i]) return ta[i] - tb[i];
	}
	return 0;
}

function deriveRepoUrl(explicit, changelogText) {
	if (explicit) return explicit.replace(/\/+$/, '');
	const env = process.env.GITHUB_REPOSITORY;
	if (env && /^[^/]+\/[^/]+$/.test(env)) {
		return `https://github.com/${env}`;
	}
	// Fall back to scanning existing link block.
	const m = changelogText.match(
		/^\[[^\]]+\]:\s*(https?:\/\/github\.com\/[^/]+\/[^/]+)/m
	);
	if (m) return m[1];
	throw new Error(
		'Could not determine repo URL: pass --repo, set $GITHUB_REPOSITORY, ' +
			'or ensure CHANGELOG.md already contains a github.com link.'
	);
}

function findHeadingLine(lines, predicate) {
	for (let i = 0; i < lines.length; i++) {
		if (predicate(lines[i])) return i;
	}
	return -1;
}

function listReleaseVersionsInOrder(lines) {
	// Returns the version strings (excluding "Unreleased") in the order they
	// appear in the file, i.e. newest first.
	const re = /^##\s*\[([^\]]+)\]/;
	const out = [];
	for (const line of lines) {
		const m = re.exec(line);
		if (m && m[1] !== 'Unreleased') out.push(m[1]);
	}
	return out;
}

function readPackageVersion() {
	try {
		const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
		return typeof pkg.version === 'string' ? pkg.version : null;
	} catch {
		return null;
	}
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help || args.positional.length === 0) {
		console.error(
			'usage: prepare-changelog-release.mjs <version> [--repo <url>] [--changelog <path>]'
		);
		process.exit(args.help ? 0 : 2);
	}
	const version = args.positional[0];
	if (!/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(version)) {
		console.error(`error: ${version} does not look like a semver version`);
		process.exit(2);
	}

	const changelogPath = resolve(args.changelog ?? 'CHANGELOG.md');
	const original = readFileSync(changelogPath, 'utf8');
	const eol = original.includes('\r\n') ? '\r\n' : '\n';
	const lines = original.split(/\r?\n/);
	const repoUrl = deriveRepoUrl(args.repo, original);

	// Sanity warnings (non-fatal).
	const pkgVersion = readPackageVersion();
	if (pkgVersion && pkgVersion !== version) {
		console.error(
			`::warning::package.json#version is "${pkgVersion}" but this script ` +
				`is preparing CHANGELOG for "${version}". Bump package.json first ` +
				`if this is unintended.`
		);
	}

	const existingVersions = listReleaseVersionsInOrder(lines);
	const previousVersion = existingVersions.find((v) => v !== version) ?? null;
	if (previousVersion) {
		const cmp = compareSemver(version, previousVersion);
		if (cmp !== null && cmp <= 0) {
			console.error(
				`::warning::version "${version}" is not greater than previous ` +
					`release "${previousVersion}". Double-check the version bump.`
			);
		}
	}

	// --- Step 1: heading rename ---
	const unreleasedIdx = findHeadingLine(lines, (l) => /^##\s*\[Unreleased\]\s*$/.test(l));
	const versionHeadingRe = new RegExp(
		`^##\\s*\\[${version.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\]`
	);
	const versionIdx = findHeadingLine(lines, (l) => versionHeadingRe.test(l));

	let headingChanged = false;
	if (versionIdx !== -1) {
		// The version already has its own heading — nothing to do for step 1.
		// (Common case: human already promoted the heading manually, or the
		// workflow is being re-run.)
		console.error(
			`info: heading "## [${version}]" already exists at line ${versionIdx + 1}; ` +
				`leaving heading section untouched.`
		);
	} else if (unreleasedIdx === -1) {
		console.error(
			`error: no "## [Unreleased]" heading found and no "## [${version}]" heading ` +
				`exists either. Nothing to promote.`
		);
		process.exit(1);
	} else {
		lines[unreleasedIdx] = `## [${version}] - ${todayUtcDate()}`;
		headingChanged = true;
	}

	// --- Step 2: rebuild the reference-link block ---
	// Find where the link block starts. A link line looks like:
	//   [tag]: https?://...
	// The block is the contiguous trailing region of such lines (with optional
	// blank lines between them). Anything above it stays untouched.
	let blockStart = lines.length;
	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i];
		if (line.trim() === '') continue;
		if (/^\[[^\]]+\]:\s*\S+/.test(line)) {
			blockStart = i;
			continue;
		}
		// First non-link, non-blank line scanning upward — block starts after it.
		break;
	}

	// Extract existing link entries keyed by label, preserving original lines
	// for labels we won't rewrite.
	const existingLinks = new Map();
	for (let i = blockStart; i < lines.length; i++) {
		const m = /^\[([^\]]+)\]:\s*(.+)$/.exec(lines[i]);
		if (m) existingLinks.set(m[1], m[2].trim());
	}

	const compareUrl = (from, to) => `${repoUrl}/compare/${from}...${to}`;
	const tagUrl = (tag) => `${repoUrl}/releases/tag/${tag}`;

	// Rebuild the canonical block:
	//   [Unreleased]: <repo>/compare/v<version>...HEAD
	//   [<version>]:  <repo>/compare/v<prev>...v<version>   (or tag URL)
	//   <preserve all other existing entries in their original order>
	const rebuilt = [];
	rebuilt.push(`[Unreleased]: ${compareUrl(`v${version}`, 'HEAD')}`);
	if (previousVersion) {
		rebuilt.push(
			`[${version}]: ${compareUrl(`v${previousVersion}`, `v${version}`)}`
		);
	} else {
		rebuilt.push(`[${version}]: ${tagUrl(`v${version}`)}`);
	}

	// Preserve the order of the remaining links as they appeared in the file,
	// minus the two we just rewrote.
	const written = new Set(['Unreleased', version]);
	for (let i = blockStart; i < lines.length; i++) {
		const m = /^\[([^\]]+)\]:\s*(.+)$/.exec(lines[i]);
		if (!m) continue;
		const label = m[1];
		if (written.has(label)) continue;
		rebuilt.push(`[${label}]: ${m[2].trim()}`);
		written.add(label);
	}

	// Diff: did the link block actually change?
	const oldBlockText = lines.slice(blockStart).join(eol).replace(/\s+$/, '');
	const newBlockText = rebuilt.join(eol);
	const linksChanged = oldBlockText !== newBlockText;

	// Assemble final output: everything above blockStart + a blank separator
	// (if needed) + the rebuilt block.
	const head = lines.slice(0, blockStart);
	while (head.length > 0 && head[head.length - 1].trim() === '') {
		head.pop();
	}
	const finalLines = [...head, '', ...rebuilt];
	const finalText = finalLines.join(eol) + eol;

	if (!headingChanged && !linksChanged) {
		console.error('info: CHANGELOG.md already up to date for this version.');
		process.exit(0);
	}

	writeFileSync(changelogPath, finalText, 'utf8');
	console.error(
		`updated ${changelogPath}: ` +
			`${headingChanged ? 'heading promoted' : 'heading unchanged'}, ` +
			`${linksChanged ? 'link block rewritten' : 'links unchanged'}.`
	);
}

main();
