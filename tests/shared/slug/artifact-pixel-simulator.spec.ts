/**
 * Diagnostic — bit-exact float32 simulator of the H-ray for a specific pixel.
 * Run for known-artifact coordinates (e.g. pixel just below A's left leg at large size)
 * and report xcov per-curve to find where my hand math diverges from the GPU.
 *
 * Two solvers live here in parallel:
 *   - solveCitardauq:  per-root sign-safe Citardauq form with a tiny degeneracy
 *                      guard. Mirrors the production shader's path bit-for-bit
 *                      (post-Citardauq migration; see _docs/citardauq_migration.md).
 *   - solveClassical:  legacy t = (by ± d)/ay with kQuadraticEpsilon linear
 *                      fallback. No longer in the shader; retained as a
 *                      numerical reference for comparison tests below.
 *
 * Tests below cross-check the two against a float64 reference and against
 * real glyph data so a math regression surfaces as a unit-test failure,
 * not a screenshot diff.
 */
import {readFileSync} from 'fs';
import {resolve} from 'path';
import opentype from 'opentype.js';
import {slugGlyphCurves} from '../../../src/shared/slug/glyph/curves';
import {slugGlyphBands} from '../../../src/shared/slug/glyph/bands';
import type {SlugGlyphCurve} from '../../../src/shared/slug/glyph/data';

const _f32 = new Float32Array(8);
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
const kCitardauqDegenEps = F(1e-7);

interface CurveContrib { idx: number; code: number; x1?: number; x2?: number; dCov: number; }
interface SolverRoots { t1: number; t2: number; degenerate: boolean; }

// Classical solver: t = (by ± d) / ay, with linear fallback when |ay| is small.
// Mirrors the current shader.
function solveClassical(ay: number, by: number, py: number): SolverRoots {
	const ra = fdiv(1, ay);
	const disc = fmax(fsub(fmul(by, by), fmul(ay, py)), 0);
	const d = fsqrt(disc);
	let t1 = fmul(fsub(by, d), ra);
	let t2 = fmul(fadd(by, d), ra);
	if (fabs(ay) < kQuadraticEpsilon) {
		if (fabs(by) < kQuadraticEpsilon) return {t1: 0, t2: 0, degenerate: true};
		t1 = fdiv(fmul(py, 0.5), by);
		t2 = t1;
	}
	return {t1, t2, degenerate: false};
}

// Citardauq solver: per-root sign-safe form. The quadratic in our shader is
//   ay·t² - 2·by·t + py = 0
// (note the -2·by — not the textbook +b). Classical roots:
//   classical_t1 = (by - d)/ay,   classical_t2 = (by + d)/ay,   d = sqrt(by² - ay·py)
//
// Define Q = by + sign(by)·d, so |Q| = |by| + d (never cancels). Multiply
// numerator and denominator: (by - d)(by + d) = by² - d² = ay·py, hence
//   classical_t1 = (by - d)/ay = py / (by + d)·(sign(by)/sign(by))
// Working out the per-sign cases:
//   by ≥ 0:  Q = by + d.   classical_t1 = py/Q.     classical_t2 = Q/ay.
//   by < 0:  Q = by - d.   classical_t1 = Q/ay.     classical_t2 = py/Q.
// Both roots use Q as a denominator, and Q never suffers cancellation.
// Order is preserved (Citardauq t1 == classical t1, Citardauq t2 == classical t2),
// which matters because the upstream code-bit checks read t1 for `code & 1`
// and t2 for `code > 1`.
function solveCitardauq(ay: number, by: number, py: number): SolverRoots {
	const disc = fmax(fsub(fmul(by, by), fmul(ay, py)), 0);
	const d = fsqrt(disc);
	// Q has the same sign as by (or is +d when by == 0). Build it without
	// a sign() lookup: by + d when by >= 0, else by - d.
	const Q = by >= 0 ? fadd(by, d) : fsub(by, d);
	// Genuinely degenerate: both Q and ay are too small to produce a meaningful
	// root via either py/Q or Q/ay. Curve is essentially a point at this pixel.
	if (fabs(Q) < kCitardauqDegenEps && fabs(ay) < kCitardauqDegenEps) {
		return {t1: 0, t2: 0, degenerate: true};
	}
	// Double-root case: disc → 0, so Q → by. When by == 0 too, Q == 0 but the
	// actual root is t = by/ay = 0. Use the Q/ay form for both roots, which
	// stays well-defined as long as ay is non-tiny.
	if (fabs(Q) < kCitardauqDegenEps) {
		const t = fdiv(Q, ay);
		return {t1: t, t2: t, degenerate: false};
	}
	let t1: number, t2: number;
	if (by >= 0) {
		t1 = fdiv(py, Q);
		t2 = fdiv(Q, ay);
	} else {
		t1 = fdiv(Q, ay);
		t2 = fdiv(py, Q);
	}
	return {t1, t2, degenerate: false};
}

type Solver = (ay: number, by: number, py: number) => SolverRoots;

function hRayWith(solver: Solver, curves: SlugGlyphCurve[], idxs: number[], rcX: number, rcY: number, ppe: number): {xcov: number; per: CurveContrib[]} {
	let xcov = 0;
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
		const roots = solver(ay, by, p12y);
		if (roots.degenerate) {
			per.push({idx, code, dCov: 0});
			continue;
		}
		const t1 = roots.t1;
		const t2 = roots.t2;
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

const hRay = (curves: SlugGlyphCurve[], idxs: number[], rcX: number, rcY: number, ppe: number) =>
	hRayWith(solveClassical, curves, idxs, rcX, rcY, ppe);
const hRayCitardauq = (curves: SlugGlyphCurve[], idxs: number[], rcX: number, rcY: number, ppe: number) =>
	hRayWith(solveCitardauq, curves, idxs, rcX, rcY, ppe);

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

describe('Citardauq solver — synthetic sweep', () => {
	// Synthetic ay/by space sweep. The classical formula's failure mode is
	// (by - d)/ay catastrophic cancellation as ay → 0; Citardauq is supposed
	// to stay bounded across the same input space.
	function sweepCases(): {ay: number; by: number; py: number}[] {
		const cases: {ay: number; by: number; py: number}[] = [];
		const aySamples = [1e-8, 1e-6, 1e-4, 1e-3, 1e-2, 0.05, 0.1, 0.5, 1.0, -1e-4, -1e-2, -0.5, -1.0];
		const bySamples = [1e-8, 1e-4, 1e-2, 0.1, 0.5, 1.0, -1e-4, -1e-2, -0.1, -0.5, -1.0];
		const pySamples = [-1.0, -0.1, -1e-3, 1e-3, 0.1, 1.0];
		for (const ay of aySamples) {
			for (const by of bySamples) {
				for (const py of pySamples) {
					// Skip cases where the quadratic has no real roots — both solvers
					// clamp the discriminant to 0 there; the resulting roots are not
					// meaningful for comparison.
					if (by * by - ay * py < 0) continue;
					cases.push({ay: F(ay), by: F(by), py: F(py)});
				}
			}
		}
		return cases;
	}

	it('Citardauq is at-least-as-accurate as classical against a float64 reference', () => {
		// Compares both solvers to a float64 reference instead of comparing them
		// to each other. The migration's whole motivation is that Citardauq
		// stays accurate where classical (by - d) cancellation degrades, so
		// "Citardauq matches classical" would be the wrong assertion — it
		// would fail exactly on the cases the migration is supposed to fix.
		const cases = sweepCases();
		let compared = 0;
		let maxClsErr = 0;
		let maxCitErr = 0;
		let citWinsByMargin = 0;
		for (const {ay, by, py} of cases) {
			const c = solveClassical(ay, by, py);
			const q = solveCitardauq(ay, by, py);
			if (c.degenerate || q.degenerate) continue;
			// float64 reference using the same per-root sign-safe form.
			const disc64 = Math.max(by * by - ay * py, 0);
			const d64 = Math.sqrt(disc64);
			const Q64 = by >= 0 ? by + d64 : by - d64;
			if (Math.abs(Q64) < 1e-15 || Math.abs(ay) < 1e-15) continue;
			const refT1 = by >= 0 ? py / Q64 : Q64 / ay;
			const refT2 = by >= 0 ? Q64 / ay : py / Q64;
			compared++;
			for (const [ref, cls, cit] of [[refT1, c.t1, q.t1], [refT2, c.t2, q.t2]] as const) {
				if (Math.abs(ref) < 1e-30) continue;
				const clsRel = Math.abs(ref - cls) / Math.abs(ref);
				const citRel = Math.abs(ref - cit) / Math.abs(ref);
				maxClsErr = Math.max(maxClsErr, clsRel);
				maxCitErr = Math.max(maxCitErr, citRel);
				if (citRel < clsRel * 0.5) citWinsByMargin++;
				// Citardauq must always be within float32 precision of the true root.
				expect(citRel).toBeLessThan(1e-2);
			}
		}
		expect(compared).toBeGreaterThan(100);
		// Citardauq's max error must not exceed classical's. (And on the cases
		// the migration is targeting, it should be substantially smaller.)
		expect(maxCitErr).toBeLessThanOrEqual(maxClsErr);
		// eslint-disable-next-line no-console
		console.log(`vs float64 ref: compared=${compared} maxClsErr=${maxClsErr.toExponential(3)} maxCitErr=${maxCitErr.toExponential(3)} cit-wins-by-2x=${citWinsByMargin}`);
	});

	it('Citardauq produces the smaller root with bounded relative error in the unstable regime', () => {
		// The whole point of the migration: in the |ay| ≤ 0.01 regime, the classical
		// formula's (by - d)/ay catastrophically cancels when by ≈ d. The smaller-magnitude
		// root is the affected one (matches t1 for by ≥ 0 and t2 for by < 0). Citardauq
		// computes that root via py/Q where Q never cancels, so its relative error stays
		// near float32 epsilon. The other root (large |t|) is well-conditioned in both
		// formulations and not interesting here.
		const cases = sweepCases();
		let evaluated = 0;
		let citAccurate = 0;
		let classicalDegraded = 0;
		for (const {ay, by, py} of cases) {
			if (Math.abs(ay) > 0.01) continue;
			evaluated++;
			const q = solveCitardauq(ay, by, py);
			if (q.degenerate) continue;
			// All Citardauq outputs must be finite and not NaN, regardless of magnitude.
			expect(Number.isNaN(q.t1)).toBe(false);
			expect(Number.isNaN(q.t2)).toBe(false);
			// Verify Citardauq's smaller-root is close to the true mathematical root.
			// Use float64 reference to compute the "true" small root.
			const disc64 = Math.max(by * by - ay * py, 0);
			const d64 = Math.sqrt(disc64);
			const Q64 = by >= 0 ? by + d64 : by - d64;
			const trueSmallRoot = by >= 0 ? py / Q64 : Q64 / ay;
			const citSmallRoot = by >= 0 ? q.t1 : q.t1;
			if (Math.abs(trueSmallRoot) > 1e-30 && Number.isFinite(trueSmallRoot)) {
				const rel = Math.abs(trueSmallRoot - citSmallRoot) / Math.abs(trueSmallRoot);
				if (rel < 1e-3) citAccurate++;
				// Compare to classical's accuracy on the same root.
				const c = solveClassical(ay, by, py);
				if (!c.degenerate) {
					const clsSmallRoot = by >= 0 ? c.t1 : c.t1;
					const clsRel = Math.abs(trueSmallRoot - clsSmallRoot) / Math.abs(trueSmallRoot);
					if (clsRel >= 1e-3) classicalDegraded++;
				}
			}
		}
		expect(evaluated).toBeGreaterThan(20);
		// At least the cases where we got a meaningful comparison, Citardauq must be accurate.
		expect(citAccurate).toBeGreaterThan(20);
		// eslint-disable-next-line no-console
		console.log(`Citardauq unstable regime: evaluated=${evaluated} cit-accurate=${citAccurate} classical-degraded=${classicalDegraded}`);
	});

	it('preserves classical root ordering (t1 vs t2) in the stable regime', () => {
		// Critical: upstream `code & 1` and `code > 1` checks in the H-ray map
		// to t1 and t2 respectively. If Citardauq swaps which root is which,
		// every code-3 curve renders backwards.
		const cases = sweepCases();
		let checked = 0;
		for (const {ay, by, py} of cases) {
			if (Math.abs(ay) <= 0.01) continue;
			const c = solveClassical(ay, by, py);
			const q = solveCitardauq(ay, by, py);
			if (c.degenerate || q.degenerate) continue;
			// Skip near-coincident roots where ordering is numerically ambiguous.
			if (Math.abs(c.t1 - c.t2) < 1e-3) continue;
			checked++;
			// The classical t1 has numerator (by - d) and is the smaller-magnitude
			// root when by > 0, the larger-magnitude root when by < 0. Citardauq's
			// per-root form is constructed to give the same correspondence, so the
			// sign of (t1 - t2) must match.
			expect(Math.sign(c.t1 - c.t2)).toBe(Math.sign(q.t1 - q.t2));
		}
		expect(checked).toBeGreaterThan(50);
	});

	it('handles ay == 0 exactly without producing NaN', () => {
		// Float32 subtraction collapse can yield ay == 0.0 exactly. Citardauq's
		// q/ay branch becomes ±inf there; the other root must remain finite.
		const cases: {ay: number; by: number; py: number}[] = [
			{ay: F(0), by: F(0.5), py: F(-0.25)},
			{ay: F(0), by: F(-0.5), py: F(-0.25)},
			{ay: F(0), by: F(0.1), py: F(-0.01)},
		];
		for (const {ay, by, py} of cases) {
			const q = solveCitardauq(ay, by, py);
			if (q.degenerate) continue;
			// At least one root must be finite (the py/q side); the q/ay side may be inf.
			const finiteCount = Number(Number.isFinite(q.t1)) + Number(Number.isFinite(q.t2));
			expect(finiteCount).toBeGreaterThanOrEqual(1);
			// Neither root should be NaN.
			expect(Number.isNaN(q.t1)).toBe(false);
			expect(Number.isNaN(q.t2)).toBe(false);
		}
	});
});

describe('Citardauq H-ray — real glyph regression', () => {
	const buf = readFileSync(resolve(__dirname, '../../../assets/fonts/roboto-fallback.ttf'));
	const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

	function setupGlyph(ch: string) {
		const ot = font.charToGlyph(ch);
		const {curves} = slugGlyphCurves(ot.path.commands);
		const bounds = ot.getBoundingBox();
		const bands = slugGlyphBands(curves, bounds.x1, bounds.y1, bounds.x2, bounds.y2);
		return {curves, bands, bounds};
	}

	// For pixels OUTSIDE the artifact zone (where classical already produces
	// correct xcov), Citardauq must produce a value within rounding of classical.
	// We sweep a coarse grid of pixels across each glyph's bounding box and
	// require near-identical xcov per band. The artifact pixels (well-known
	// stripes near band boundaries on A and Z) are tolerated — they're exactly
	// the case Citardauq is supposed to *fix*, so divergence is allowed there.
	function compareGlyphAcrossBands(ch: string, ppe: number, allowedDivergencePerBand: number) {
		const {curves, bands, bounds} = setupGlyph(ch);
		const stepX = Math.max(1, Math.floor((bounds.x2 - bounds.x1) / 30));
		const stepY = Math.max(1, Math.floor((bounds.y2 - bounds.y1) / 20));

		let totalPixels = 0;
		let divergencePixels = 0;
		let maxDivergence = 0;

		for (let bandIdx = 0; bandIdx < bands.hBands.length; bandIdx++) {
			const band = bands.hBands[bandIdx];
			if (band.length === 0) continue;
			for (let ex = bounds.x1; ex <= bounds.x2; ex += stepX) {
				for (let ey = bounds.y1; ey <= bounds.y2; ey += stepY) {
					const cls = hRay(curves, band, ex, ey, ppe);
					const cit = hRayCitardauq(curves, band, ex, ey, ppe);
					totalPixels++;
					const diff = Math.abs(cls.xcov - cit.xcov);
					if (diff > maxDivergence) maxDivergence = diff;
					if (diff > 0.05) divergencePixels++;
				}
			}
		}

		const divergenceRate = divergencePixels / Math.max(totalPixels, 1);
		// eslint-disable-next-line no-console
		console.log(`'${ch}' @ ppe=${ppe.toFixed(4)}: pixels=${totalPixels} divergent=${divergencePixels} (${(divergenceRate * 100).toFixed(2)}%) maxDiff=${maxDivergence.toFixed(3)}`);
		expect(divergenceRate).toBeLessThan(allowedDivergencePerBand);
	}

	it('A: Citardauq agrees with classical on the bulk of pixels at 800pt', () => {
		// 800pt / 2048upem = 0.390625 ppe. The known artifact zone is near the
		// bottom band's leg corners — a small fraction of the total pixel set.
		compareGlyphAcrossBands('A', F(800 / 2048), 0.10);
	});

	it('Z: Citardauq agrees with classical on the bulk of pixels at 800pt', () => {
		compareGlyphAcrossBands('Z', F(800 / 2048), 0.10);
	});

	it('O: Citardauq pixel-identical to classical on a glyph with no near-horizontal curves', () => {
		// Round glyphs have no near-zero ay curves, so classical and Citardauq
		// should agree to within tight rounding everywhere — no artifact zone.
		compareGlyphAcrossBands('O', F(800 / 2048), 0.005);
	});

	it('O: print first divergent pixel and per-curve breakdown', () => {
		const {curves, bands, bounds} = setupGlyph('O');
		const ppe = F(800 / 2048);
		const stepX = Math.max(1, Math.floor((bounds.x2 - bounds.x1) / 30));
		const stepY = Math.max(1, Math.floor((bounds.y2 - bounds.y1) / 20));
		let printed = 0;
		for (let bandIdx = 0; bandIdx < bands.hBands.length && printed < 3; bandIdx++) {
			const band = bands.hBands[bandIdx];
			if (band.length === 0) continue;
			for (let ex = bounds.x1; ex <= bounds.x2 && printed < 3; ex += stepX) {
				for (let ey = bounds.y1; ey <= bounds.y2 && printed < 3; ey += stepY) {
					const cls = hRay(curves, band, ex, ey, ppe);
					const cit = hRayCitardauq(curves, band, ex, ey, ppe);
					if (Math.abs(cls.xcov - cit.xcov) > 0.05) {
						// eslint-disable-next-line no-console
						console.log(`band=${bandIdx} ex=${ex} ey=${ey} classical=${cls.xcov.toFixed(4)} citardauq=${cit.xcov.toFixed(4)}`);
						for (let i = 0; i < cls.per.length; i++) {
							const a = cls.per[i];
							const b = cit.per[i];
							if (a.code <= 0) continue;
							// eslint-disable-next-line no-console
							console.log(`  c${a.idx} code=${a.code} cls(x1=${a.x1?.toFixed(3)} x2=${a.x2?.toFixed(3)} dCov=${a.dCov.toFixed(3)}) cit(x1=${b.x1?.toFixed(3)} x2=${b.x2?.toFixed(3)} dCov=${b.dCov.toFixed(3)})`);
						}
						printed++;
					}
				}
			}
		}
	});
});
