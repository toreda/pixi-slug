/**
 * Diagnostic — bit-exact float32 simulator of the H-ray for a specific pixel.
 * Run for known-artifact coordinates (e.g. pixel just below A's left leg at large size)
 * and report xcov per-curve to find where my hand math diverges from the GPU.
 */
import {readFileSync} from 'fs';
import {resolve} from 'path';
import opentype from 'opentype.js';
import {slugGlyphCurves} from '../../../src/shared/slug/glyph/curves';
import {slugGlyphBands} from '../../../src/shared/slug/glyph/bands';
import type {SlugGlyphCurve} from '../../../src/shared/slug/glyph/data';

const _f32 = new Float32Array(8);
const _f32Idx = {a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7};
function F(v: number): number {
	_f32[0] = v;
	return _f32[0];
}
function f32op2(op: (a: number, b: number) => number, a: number, b: number): number {
	_f32[1] = a;
	_f32[2] = b;
	_f32[3] = op(_f32[1], _f32[2]);
	return _f32[3];
}
const fmul = (a: number, b: number) => f32op2((x, y) => x * y, a, b);
const fadd = (a: number, b: number) => f32op2((x, y) => x + y, a, b);
const fsub = (a: number, b: number) => f32op2((x, y) => x - y, a, b);
const fdiv = (a: number, b: number) => f32op2((x, y) => x / y, a, b);
function fsqrt(v: number): number { _f32[0] = Math.sqrt(F(v)); return _f32[0]; }
function fabs(v: number): number { return Math.abs(F(v)); }
function fmax(a: number, b: number): number { return Math.max(F(a), F(b)); }
function fclamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, F(v))); }

const kQuadraticEpsilon = F(0.0001);

interface CurveContrib { idx: number; code: number; x1?: number; x2?: number; dCov: number; }

function hRay(curves: SlugGlyphCurve[], idxs: number[], rcX: number, rcY: number, ppe: number): {xcov: number; per: CurveContrib[]} {
	let xcov = 0, xwgt = 0;
	const per: CurveContrib[] = [];
	for (const idx of idxs) {
		const c = curves[idx];
		const p12x = fsub(c.p1x, rcX), p12y = fsub(c.p1y, rcY);
		const p12z = fsub(c.p2x, rcX), p12w = fsub(c.p2y, rcY);
		const p3x = fsub(c.p3x, rcX),  p3y = fsub(c.p3y, rcY);
		const maxX = fmax(fmax(p12x, p12z), p3x);
		if (fmul(maxX, ppe) < -0.5) {
			per.push({idx, code: -1, dCov: 0});
			break;
		}
		const code = (0x2E74 >> ((p12y > 0 ? 2 : 0) + (p12w > 0 ? 4 : 0) + (p3y > 0 ? 8 : 0))) & 3;
		if (code === 0) {
			per.push({idx, code, dCov: 0});
			continue;
		}
		const ax = fadd(fsub(p12x, fmul(p12z, 2)), p3x);
		const ay = fadd(fsub(p12y, fmul(p12w, 2)), p3y);
		const bx = fsub(p12x, p12z);
		const by = fsub(p12y, p12w);
		let t1: number, t2: number;
		const ra = fdiv(1, ay);
		const disc = fmax(fsub(fmul(by, by), fmul(ay, p12y)), 0);
		const d = fsqrt(disc);
		t1 = fmul(fsub(by, d), ra);
		t2 = fmul(fadd(by, d), ra);
		if (fabs(ay) < kQuadraticEpsilon) {
			if (fabs(by) < kQuadraticEpsilon) { per.push({idx, code, dCov: 0}); continue; }
			t1 = fdiv(fmul(p12y, 0.5), by);
			t2 = t1;
		}
		const x1 = fmul(fadd(fmul(fsub(fmul(ax, t1), fmul(bx, 2)), t1), p12x), ppe);
		const x2 = fmul(fadd(fmul(fsub(fmul(ax, t2), fmul(bx, 2)), t2), p12x), ppe);
		let dCov = 0;
		if ((code & 1) !== 0) {
			dCov += fclamp(fadd(x1, 0.5), 0, 1);
			xcov = fadd(xcov, fclamp(fadd(x1, 0.5), 0, 1));
		}
		if (code > 1) {
			dCov -= fclamp(fadd(x2, 0.5), 0, 1);
			xcov = fsub(xcov, fclamp(fadd(x2, 0.5), 0, 1));
		}
		per.push({idx, code, x1, x2, dCov});
	}
	return {xcov, per};
}

describe('Artifact pixel simulator', () => {
	const buf = readFileSync(resolve(__dirname, '../../../assets/fonts/roboto-fallback.ttf'));
	const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

	it('A: scan em-y range across bottom band at multiple em-x columns', () => {
		const ot = font.charToGlyph('A');
		const {curves} = slugGlyphCurves(ot.path.commands);
		const bounds = ot.getBoundingBox();
		const bands = slugGlyphBands(curves, bounds.x1, bounds.y1, bounds.x2, bounds.y2);
		// fontSize=400, unitsPerEm=2048 → ppe = 0.1953125
		const ppe = F(400 / 2048);

		// Sweep ALL pixels in band 0 for the GPU-equivalent artifact area.
		// Em-y range matching band 0 (~104 em-units high), em-x across full glyph.
		const findings: string[] = [];
		findings.push(`hBand[0] = [${bands.hBands[0].join(',')}], pixelsPerEm.x = ${ppe}`);

		// Look specifically at em-x just OUTSIDE the left leg (em-x in [0, 28], left of em-x=29).
		// And em-x just OUTSIDE the right leg (em-x > 1310).
		// These should all produce xcov ≈ 0.
		findings.push('--- em-x left of leftleg (should be xcov=0) ---');
		for (let ex = 0; ex <= 28; ex += 4) {
			for (let ey = 0; ey <= 80; ey += 4) {
				const {xcov, per} = hRay(curves, bands.hBands[0], ex, ey, ppe);
				if (Math.abs(xcov) > 0.05) {
					const detail = per.filter(p => p.code !== 0)
						.map(p => `c${p.idx}(${p.code}, dCov=${p.dCov.toFixed(2)})`).join(' ');
					findings.push(`  ex=${ex.toString().padStart(4)} ey=${ey.toString().padStart(2)} → xcov=${xcov.toFixed(3)}  ${detail}`);
				}
			}
		}
		// Dilation halo: em-y BELOW baseline (where the quad extends past the bbox).
		findings.push('--- em-y below baseline (dilation halo, should be xcov=0) ---');
		for (let ex = 0; ex <= 1310; ex += 50) {
			for (let ey = -10; ey < 0; ey += 1) {
				const {xcov, per} = hRay(curves, bands.hBands[0], ex, ey, ppe);
				if (Math.abs(xcov) > 0.05) {
					const detail = per.filter(p => p.code !== 0)
						.map(p => `c${p.idx}(${p.code}, dCov=${p.dCov.toFixed(2)})`).join(' ');
					findings.push(`  ex=${ex.toString().padStart(4)} ey=${ey.toString().padStart(3)} → xcov=${xcov.toFixed(3)}  ${detail}`);
				}
			}
		}
		findings.push('--- em-x in V-cavity (should be xcov=0) ---');
		for (let ex = 230; ex <= 1100; ex += 80) {
			for (let ey = 0; ey <= 80; ey += 4) {
				const {xcov, per} = hRay(curves, bands.hBands[0], ex, ey, ppe);
				if (Math.abs(xcov) > 0.05) {
					const detail = per.filter(p => p.code !== 0)
						.map(p => `c${p.idx}(${p.code}, dCov=${p.dCov.toFixed(2)})`).join(' ');
					findings.push(`  ex=${ex.toString().padStart(4)} ey=${ey.toString().padStart(2)} → xcov=${xcov.toFixed(3)}  ${detail}`);
				}
			}
		}
		findings.push('--- em-x right of rightleg (should be xcov=0) ---');
		for (let ex = 1311; ex <= 1400; ex += 8) {
			for (let ey = 0; ey <= 80; ey += 4) {
				const {xcov, per} = hRay(curves, bands.hBands[0], ex, ey, ppe);
				if (Math.abs(xcov) > 0.05) {
					const detail = per.filter(p => p.code !== 0)
						.map(p => `c${p.idx}(${p.code}, dCov=${p.dCov.toFixed(2)})`).join(' ');
					findings.push(`  ex=${ex.toString().padStart(4)} ey=${ey.toString().padStart(2)} → xcov=${xcov.toFixed(3)}  ${detail}`);
				}
			}
		}
		// eslint-disable-next-line no-console
		console.log(findings.join('\n'));
	});
});
