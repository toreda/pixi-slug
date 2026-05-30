/**
 * Preset MathText formulas used by the example pages. Each preset is a
 * factory `(m) => MathNode | MathNode[]` consumed via `MathText.build`.
 * The wire helper picks one by the `ctrlMathPreset` value.
 *
 * Coverage rationale: each preset exercises a different subset of the
 * v1 builder so visual smoke-testing across the dropdown surfaces any
 * single primitive's layout bugs quickly. See spec §14.2 (Why a preset
 * dropdown instead of a builder UI).
 */
(function () {
	window.SlugMathPresets = {
		// x = (-b ± √(b² - 4ac)) / 2a
		quadratic: function (m) {
			return m.row(
				'x',
				m.op('='),
				m.frac(
					m.row(
						m.op('−'),
						'b',
						m.pm(),
						m.sqrt(m.row(m.sup('b', '2'), m.op('−'), '4ac'), {vAlign: 'bottom'})
					),
					m.text('2a')
				)
			);
		},

		// Σ from i=1 to n of x_i / n
		summation: function (m) {
			return m.row(m.summation(m.row('i', m.op('='), '1'), 'n', m.frac(m.sub('x', 'i'), 'n')));
		},

		// [ a b ; c d ]
		matrix: function (m) {
			return m.matrix(
				[
					['a', 'b'],
					['c', 'd']
				],
				'bracket'
			);
		},

		// Normal-distribution PDF: (1 / σ√(2π)) e^{ -(x-μ)² / 2σ² }
		gaussian: function (m) {
			return m.row(
				'f(x)',
				m.op('='),
				m.frac('1', m.row('σ', m.sqrt(m.row('2π')))),
				m.sup(
					'e',
					m.row(
						m.text('-'),
						m.frac(
							m.sup(m.paren(m.row('x', m.text(' - '), 'μ')), '2'),
							m.row('2', m.sup('σ', '2'))
						)
					)
				)
			);
		},

		// f(x) = { x  if x ≥ 0 ; -x  otherwise }
		cases: function (m) {
			return m.row(
				'f(x)',
				m.op('='),
				m.cases([
					[m.text('x'), m.row(m.text('if '), 'x', m.geq(), '0')],
					[m.text('-x'), m.text('otherwise')]
				])
			);
		},

		// a² + b² = c² — each squared term is a single SlugText using its
		// built-in superscript feature (m.slug) rather than the math engine's
		// own m.sup layout container.
		pythagorean: function (m) {
			return m.row(
				m.slug('a', {superscript: '2'}),
				m.op('+'),
				m.slug('b', {superscript: '2'}),
				m.op('='),
				m.slug('c', {superscript: '2'})
			);
		},

		// ⟨φ|ψ⟩ = ∫ φ*(x) ψ(x) dx
		braket: function (m) {
			return m.row(
				m.braket('φ', 'ψ'),
				m.op('='),
				m.integral(null, null, m.row(m.sup('φ', '*'), '(x)', m.text(' '), 'ψ(x)', m.text(' dx')))
			);
		},

		// T^{ij}_{kl}
		tensor: function (m) {
			return m.tensor('T', ['i', 'j'], ['k', 'l']);
		},

		// sin²(x) + cos²(x) = 1
		trig: function (m) {
			return m.row(
				m.sin(null, '2'),
				m.paren('x'),
				m.op('+'),
				m.cos(null, '2'),
				m.paren('x'),
				m.op('='),
				m.text('1')
			);
		},

		// Three-line aligned equation system: y = mx + b ; m = Δy/Δx ; b = y - mx
		system: function (m) {
			return [
				m.row('y', m.op('='), 'mx + b'),
				m.row('m', m.op('='), m.frac('Δy', 'Δx')),
				m.row('b', m.op('='), m.text('y - mx'))
			];
		}
	};
})();
