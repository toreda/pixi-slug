#!/usr/bin/env node
// Package release zips from the dist/ output produced by `pnpm build:all:prod`.
//
// Produces, in artifacts/ by default:
//   pixi-slug-v6-<version>.zip   (just dist/v6/)
//   pixi-slug-v7-<version>.zip   (just dist/v7/)
//   pixi-slug-v8-<version>.zip   (just dist/v8/)
//   pixi-slug-all-<version>.zip  (dist/v6 + dist/v7 + dist/v8)
//
// Usage:
//   node scripts/package-release-zips.mjs [<version>] [--dist <dir>] [--out <dir>]
//
// `version` defaults to package.json#version. `--dist` defaults to ./dist,
// `--out` defaults to ./artifacts.
//
// Cross-platform: uses Node's zlib + a minimal zip writer rather than shelling
// out to the `zip` CLI (which isn't installed on Windows by default).

import {createReadStream, mkdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {readdir} from 'node:fs/promises';
import {join, posix, relative, resolve, sep} from 'node:path';
import {createDeflateRaw} from 'node:zlib';
import {pipeline} from 'node:stream/promises';
import {Buffer} from 'node:buffer';

function parseArgs(argv) {
	const args = {positional: []};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--dist') args.dist = argv[++i];
		else if (a === '--out') args.out = argv[++i];
		else if (a === '--help' || a === '-h') args.help = true;
		else args.positional.push(a);
	}
	return args;
}

async function walk(rootDir) {
	const out = [];
	async function recurse(dir) {
		const entries = await readdir(dir, {withFileTypes: true});
		for (const e of entries) {
			const full = join(dir, e.name);
			if (e.isDirectory()) await recurse(full);
			else if (e.isFile()) out.push(full);
		}
	}
	await recurse(rootDir);
	return out;
}

// crc32 — table-based, matches PKZIP.
const CRC_TABLE = (() => {
	const t = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		t[i] = c >>> 0;
	}
	return t;
})();
function crc32(buf) {
	let c = 0xffffffff;
	for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

async function deflateRaw(buf) {
	const chunks = [];
	const stream = createDeflateRaw({level: 9});
	await pipeline(
		(async function* () {
			yield buf;
		})(),
		stream,
		async function (source) {
			for await (const chunk of source) chunks.push(chunk);
		}
	);
	return Buffer.concat(chunks);
}

function dosTime(date) {
	const t = ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((date.getSeconds() / 2) & 0x1f);
	return t & 0xffff;
}
function dosDate(date) {
	const d = (((date.getFullYear() - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0xf) << 5) | (date.getDate() & 0x1f);
	return d & 0xffff;
}

// Build a minimal zip archive. Each entry is stored with deflate compression.
async function buildZip(entries) {
	// entries: [{archivePath: 'v8/index.js', absPath: '/.../dist/v8/index.js'}]
	const localChunks = [];
	const centralChunks = [];
	let offset = 0;
	const now = new Date();
	const time = dosTime(now);
	const date = dosDate(now);

	for (const entry of entries) {
		const data = readFileSync(entry.absPath);
		const compressed = await deflateRaw(data);
		const crc = crc32(data);
		const nameBuf = Buffer.from(entry.archivePath, 'utf8');

		// Local file header
		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50, 0);
		local.writeUInt16LE(20, 4); // version needed
		local.writeUInt16LE(0x0800, 6); // general purpose: bit 11 = UTF-8 names
		local.writeUInt16LE(8, 8); // method: deflate
		local.writeUInt16LE(time, 10);
		local.writeUInt16LE(date, 12);
		local.writeUInt32LE(crc, 14);
		local.writeUInt32LE(compressed.length, 18); // compressed size
		local.writeUInt32LE(data.length, 22); // uncompressed size
		local.writeUInt16LE(nameBuf.length, 26);
		local.writeUInt16LE(0, 28); // extra field length
		localChunks.push(local, nameBuf, compressed);

		// Central directory record
		const central = Buffer.alloc(46);
		central.writeUInt32LE(0x02014b50, 0);
		central.writeUInt16LE(20, 4); // version made by
		central.writeUInt16LE(20, 6); // version needed
		central.writeUInt16LE(0x0800, 8);
		central.writeUInt16LE(8, 10);
		central.writeUInt16LE(time, 12);
		central.writeUInt16LE(date, 14);
		central.writeUInt32LE(crc, 16);
		central.writeUInt32LE(compressed.length, 20);
		central.writeUInt32LE(data.length, 24);
		central.writeUInt16LE(nameBuf.length, 28);
		central.writeUInt16LE(0, 30); // extra
		central.writeUInt16LE(0, 32); // comment
		central.writeUInt16LE(0, 34); // disk
		central.writeUInt16LE(0, 36); // internal attrs
		central.writeUInt32LE(0, 38); // external attrs
		central.writeUInt32LE(offset, 42); // local header offset
		centralChunks.push(central, nameBuf);

		offset += local.length + nameBuf.length + compressed.length;
	}

	const centralStart = offset;
	const centralBuf = Buffer.concat(centralChunks);
	const centralSize = centralBuf.length;

	const eocd = Buffer.alloc(22);
	eocd.writeUInt32LE(0x06054b50, 0);
	eocd.writeUInt16LE(0, 4); // disk number
	eocd.writeUInt16LE(0, 6); // central dir disk
	eocd.writeUInt16LE(entries.length, 8);
	eocd.writeUInt16LE(entries.length, 10);
	eocd.writeUInt32LE(centralSize, 12);
	eocd.writeUInt32LE(centralStart, 16);
	eocd.writeUInt16LE(0, 20); // comment

	return Buffer.concat([...localChunks, centralBuf, eocd]);
}

function readPackageVersion() {
	const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
	if (typeof pkg.version !== 'string') {
		throw new Error('package.json#version is missing or not a string');
	}
	return pkg.version;
}

async function packageOne(distDir, outDir, version, includeDirs, zipName) {
	const entries = [];
	for (const subdir of includeDirs) {
		const root = join(distDir, subdir);
		try {
			statSync(root);
		} catch {
			throw new Error(`expected directory missing: ${root}`);
		}
		const files = await walk(root);
		for (const absPath of files) {
			// Archive paths are POSIX-style relative to dist/, so the zip
			// extracts to the same v6/ v7/ v8/ layout users see in dist.
			const rel = relative(distDir, absPath);
			const archivePath = rel.split(sep).join(posix.sep);
			entries.push({absPath, archivePath});
		}
	}
	if (entries.length === 0) {
		throw new Error(`no files found under ${includeDirs.map((d) => join(distDir, d)).join(', ')}`);
	}
	entries.sort((a, b) => a.archivePath.localeCompare(b.archivePath));
	const buf = await buildZip(entries);
	const outPath = join(outDir, zipName);
	writeFileSync(outPath, buf);
	console.log(`wrote ${outPath} (${entries.length} files, ${buf.length} bytes)`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		console.error(
			'usage: package-release-zips.mjs [<version>] [--dist <dir>] [--out <dir>]'
		);
		process.exit(0);
	}
	const version = args.positional[0] ?? readPackageVersion();
	const distDir = resolve(args.dist ?? 'dist');
	const outDir = resolve(args.out ?? 'artifacts');
	mkdirSync(outDir, {recursive: true});

	const versions = ['v6', 'v7', 'v8'];
	for (const v of versions) {
		await packageOne(distDir, outDir, version, [v], `pixi-slug-${v}-${version}.zip`);
	}
	await packageOne(distDir, outDir, version, versions, `pixi-slug-all-${version}.zip`);
}

main().catch((err) => {
	console.error(`error: ${err.message ?? err}`);
	process.exit(1);
});
