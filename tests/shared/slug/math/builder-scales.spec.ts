import {mathBuilder} from '../../../../src/shared/slug/math/builder';

describe('mathBuilder per-slot scale overrides', () => {
	const m = mathBuilder;

	describe('bigop family', () => {
		it('records summation scales on the node', () => {
			const n = m.summation('k=1', '5', 'a(k)', {
				scales: {upper: 0.8, lower: 0.8, body: 1.0, symbol: 2.0}
			});
			expect(n.kind).toBe('bigop');
			if (n.kind !== 'bigop') throw new Error('unreachable');
			expect(n.scales).toEqual({upper: 0.8, lower: 0.8, body: 1.0, symbol: 2.0});
			expect(n.symbol).toBe('∑');
		});

		it('omits scales when not supplied', () => {
			const n = m.summation('k=1', '5', 'a(k)');
			if (n.kind !== 'bigop') throw new Error('unreachable');
			expect(n.scales).toBeUndefined();
		});

		it('records partial scale overrides without filling in missing slots', () => {
			const n = m.integral('0', '∞', 'f(x) dx', {scales: {symbol: 2.5}});
			if (n.kind !== 'bigop') throw new Error('unreachable');
			expect(n.scales).toEqual({symbol: 2.5});
		});

		it('forwards scales through bigOp generic helper', () => {
			const n = m.bigOp('⨁', null, null, 'a', {scales: {body: 0.9}});
			if (n.kind !== 'bigop') throw new Error('unreachable');
			expect(n.scales).toEqual({body: 0.9});
			expect(n.symbol).toBe('⨁');
		});
	});

	describe('fraction', () => {
		it('records scales for frac', () => {
			const n = m.frac('a', 'b', {scales: {num: 0.95, den: 0.95}});
			if (n.kind !== 'frac') throw new Error('unreachable');
			expect(n.scales).toEqual({num: 0.95, den: 0.95});
		});

		it('omits scales when not provided', () => {
			const n = m.frac('a', 'b');
			if (n.kind !== 'frac') throw new Error('unreachable');
			expect(n.scales).toBeUndefined();
		});
	});

	describe('subsup family', () => {
		// Text-atom base + scripts route to SlugText's native trailing-script
		// feature (slugScript), not the SubsupContainer layout. Scales don't
		// apply on the native path, so they're silently dropped there.
		it('routes simple text atoms to a native slugScript node', () => {
			const sup = m.sup('x', '2');
			expect(sup.kind).toBe('slugScript');
			if (sup.kind !== 'slugScript') throw new Error('unreachable');
			expect(sup.text).toBe('x');
			expect(sup.superscript).toBe('2');
			expect(sup.subscript).toBe('');

			const sub = m.sub('x', 'i');
			if (sub.kind !== 'slugScript') throw new Error('unreachable');
			expect(sub.text).toBe('x');
			expect(sub.subscript).toBe('i');
			expect(sub.superscript).toBe('');

			const both = m.subsup('x', 'i', 'n');
			if (both.kind !== 'slugScript') throw new Error('unreachable');
			expect(both.text).toBe('x');
			expect(both.subscript).toBe('i');
			expect(both.superscript).toBe('n');
		});

		it('inherits the base atom font flag on the native path', () => {
			const sub = m.sub(m.mathText('x'), 'i');
			if (sub.kind !== 'slugScript') throw new Error('unreachable');
			expect(sub.useMathFont).toBe(true);
		});

		// A sub-expression base or script can't ride as a trailing string, so
		// it falls back to the SubsupContainer layout where scales DO apply.
		it('falls back to the layout path (with scales) for sub-expression scripts', () => {
			const sup = m.sup('x', m.frac('a', 'b'), {scales: {sup: 0.6}});
			if (sup.kind !== 'sup') throw new Error('unreachable');
			expect(sup.scales).toEqual({sup: 0.6});

			const sub = m.sub(m.frac('a', 'b'), 'i', {scales: {sub: 0.6}});
			if (sub.kind !== 'sub') throw new Error('unreachable');
			expect(sub.scales).toEqual({sub: 0.6});

			const both = m.subsup('x', m.sqrt('y'), 'n', {scales: {base: 1.0, sub: 0.6, sup: 0.6}});
			if (both.kind !== 'subsup') throw new Error('unreachable');
			expect(both.scales).toEqual({base: 1.0, sub: 0.6, sup: 0.6});
		});
	});

	describe('roots', () => {
		it('records scales for sqrt and nthroot', () => {
			const s = m.sqrt('x', {scales: {radicand: 0.9}});
			if (s.kind !== 'sqrt') throw new Error('unreachable');
			expect(s.scales).toEqual({radicand: 0.9});

			const r = m.nthroot('3', 'x', {scales: {index: 0.5, radicand: 0.95}});
			if (r.kind !== 'nthroot') throw new Error('unreachable');
			expect(r.scales).toEqual({index: 0.5, radicand: 0.95});
		});
	});

	describe('fences', () => {
		it('records inner scale on paren and fence', () => {
			const p = m.paren('x', {scales: {inner: 0.95}});
			if (p.kind !== 'fence') throw new Error('unreachable');
			expect(p.scales).toEqual({inner: 0.95});
			expect(p.left).toBe('(');

			const f = m.fence('⟦', '⟧', 'x', {scales: {inner: 0.9}});
			if (f.kind !== 'fence') throw new Error('unreachable');
			expect(f.scales).toEqual({inner: 0.9});
		});

		it('records inner scale on fenceSep helpers', () => {
			const bk = m.braket('φ', 'ψ', {scales: {inner: 0.95}});
			if (bk.kind !== 'fenceSep') throw new Error('unreachable');
			expect(bk.scales).toEqual({inner: 0.95});
		});
	});

	describe('matrix and cases', () => {
		it('records cell scale on matrix', () => {
			const mat = m.matrix([['a', 'b'], ['c', 'd']], 'bracket', {scales: {cell: 0.9}});
			if (mat.kind !== 'matrix') throw new Error('unreachable');
			expect(mat.scales).toEqual({cell: 0.9});
		});

		it('records case scale on cases', () => {
			const c = m.cases([['x', 'x>0']], {scales: {case: 0.95}});
			if (c.kind !== 'cases') throw new Error('unreachable');
			expect(c.scales).toEqual({case: 0.95});
		});
	});

	describe('accents and over/brace', () => {
		it('records accent scales', () => {
			const v = m.vec('x', {scales: {accent: 0.9}});
			if (v.kind !== 'accent') throw new Error('unreachable');
			expect(v.scales).toEqual({accent: 0.9});
		});

		it('records over/underline scales', () => {
			const o = m.overline('x', {scales: {inner: 0.95}});
			if (o.kind !== 'over') throw new Error('unreachable');
			expect(o.scales).toEqual({inner: 0.95});
		});

		it('records overbrace scales (label arg in middle)', () => {
			const b = m.overbrace('x+y', 'sum', {scales: {label: 0.6}});
			if (b.kind !== 'brace') throw new Error('unreachable');
			expect(b.scales).toEqual({label: 0.6});
			expect(b.position).toBe('over');
		});
	});

	describe('tensor / binom / prime / prescript', () => {
		it('records tensor scales', () => {
			const t = m.tensor('T', ['i'], ['j'], {scales: {base: 1.0, index: 0.6}});
			if (t.kind !== 'tensor') throw new Error('unreachable');
			expect(t.scales).toEqual({base: 1.0, index: 0.6});
		});

		it('records binom scales', () => {
			const b = m.binom('n', 'k', {scales: {n: 0.9, k: 0.9}});
			if (b.kind !== 'binom') throw new Error('unreachable');
			expect(b.scales).toEqual({n: 0.9, k: 0.9});
		});

		it('records prime scales (with default count)', () => {
			const p = m.prime('f', 2, {scales: {base: 1.0}});
			if (p.kind !== 'prime') throw new Error('unreachable');
			expect(p.scales).toEqual({base: 1.0});
			expect(p.count).toBe(2);
		});

		it('records prescript scales', () => {
			const ps = m.prescript('A', '1', '2', {scales: {sub: 0.6, sup: 0.6}});
			if (ps.kind !== 'prescript') throw new Error('unreachable');
			expect(ps.scales).toEqual({sub: 0.6, sup: 0.6});
		});
	});

	describe('slug atom (native SlugText sub/superscript)', () => {
		it('builds a slugScript node with a superscript', () => {
			const n = m.slug('a', {superscript: '2'});
			expect(n.kind).toBe('slugScript');
			if (n.kind !== 'slugScript') throw new Error('unreachable');
			expect(n.text).toBe('a');
			expect(n.superscript).toBe('2');
			expect(n.subscript).toBe('');
			expect(n.supFontSize).toBeNull();
			expect(n.subFontSize).toBeNull();
			expect(n.useMathFont).toBe(false);
		});

		it('builds a slugScript node with a subscript', () => {
			const n = m.slug('x', {subscript: 'i'});
			if (n.kind !== 'slugScript') throw new Error('unreachable');
			expect(n.subscript).toBe('i');
			expect(n.superscript).toBe('');
		});

		it('forwards script font-size overrides and useMathFont', () => {
			const n = m.slug('c', {superscript: '2', supFontSize: 18, useMathFont: true});
			if (n.kind !== 'slugScript') throw new Error('unreachable');
			expect(n.supFontSize).toBe(18);
			expect(n.useMathFont).toBe(true);
		});

		it('defaults to empty scripts and null sizes when opts omitted', () => {
			const n = m.slug('z');
			if (n.kind !== 'slugScript') throw new Error('unreachable');
			expect(n.superscript).toBe('');
			expect(n.subscript).toBe('');
			expect(n.supFontSize).toBeNull();
			expect(n.subFontSize).toBeNull();
		});
	});

	describe('lower slot treated as a single text node', () => {
		// The summation lower bound is the entire "k=1" expression as ONE
		// text run — not split into index/start. The builder must accept
		// the bare-string shorthand verbatim and not split on the '='.
		it('keeps "k=1" as one text atom in the lower slot', () => {
			const n = m.summation('k=1', '5', 'a(k)');
			if (n.kind !== 'bigop') throw new Error('unreachable');
			expect(n.lower).not.toBeNull();
			expect(n.lower?.kind).toBe('text');
			if (n.lower?.kind !== 'text') throw new Error('unreachable');
			expect(n.lower.text).toBe('k=1');
		});
	});
});
