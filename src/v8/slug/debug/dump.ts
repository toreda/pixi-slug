import type {SlugText} from '../text';

/**
 * Read-only GPU-state diagnostic for a v8 {@link SlugText}.
 *
 * When a `SlugText` is in the scene and reports geometry but renders
 * nothing, {@link slugDebugDump} dumps the live GPU state of every render
 * pass so you can tell which failure class you are in:
 *
 *  - **Resource fault (textures/geometry destroyed or nulled).** Detected
 *    directly: a `destroyed` source, a zero-size source, a missing buffer,
 *    or a slot whose bound font generation is behind the font's current
 *    generation (its curve/band bindings point at sources that were
 *    destroyed by a glyph-buffer grow). Each shows up as a problem string.
 *
 *  - **Leaked GL state (the app's own shaders clobbering shared state).**
 *    NOT visible from JS object inspection — the offending state only
 *    exists at the GL draw call. This dump rules it *in by elimination*:
 *    when every resource below is valid and on the display list yet
 *    nothing draws, the fault is almost certainly leaked GL state. Confirm
 *    with the per-draw assertion ({@link slugAssertGlState}) or Spector.
 *
 * The function never mutates the SlugText. It reaches private slot/shader
 * fields through narrow casts — those fields are internal, so this lives
 * inside the package rather than the public type surface.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** State of a single bound texture/sampler resource. */
export interface SlugResourceState {
	present: boolean;
	destroyed: boolean | null;
	width: number | null;
	height: number | null;
}

/** Per-pass (shadow / stroke / fill) GPU-state report. */
export interface SlugSlotReport {
	pass: 'shadow' | 'stroke' | 'fill';
	present: boolean;
	meshInScene: boolean;
	meshDrawable: boolean;
	meshVisible: boolean;
	meshRenderable: boolean;
	meshWorldAlpha: number;
	indexCount: number;
	vertexBufferOk: boolean;
	indexBufferOk: boolean;
	curveSource: SlugResourceState;
	bandSource: SlugResourceState;
	fillGradientSource: SlugResourceState;
	fillTextureSource: SlugResourceState;
	slotGeneration: number | null;
	generationStale: boolean;
	uniforms: Record<string, unknown>;
	problems: string[];
}

/** Full report returned by {@link slugDebugDump}. */
export interface SlugDebugReport {
	ok: boolean;
	slugText: {
		destroyed: boolean;
		visible: boolean;
		renderable: boolean;
		worldAlpha: number;
		childCount: number;
		hasPendingPlan: boolean;
		onRenderAttached: boolean;
		fontResolved: boolean;
	};
	font: {
		present: boolean;
		generation: number | null;
		curveSource: SlugResourceState;
		bandSource: SlugResourceState;
		fallbackWhiteSource: SlugResourceState;
	};
	slots: SlugSlotReport[];
	problems: string[];
	hint: string;
}

/** Options for {@link slugDebugDump}. */
export interface SlugDebugOptions {
	/** Return the report without printing to the console. @default false */
	silent?: boolean;
}

function resourceState(source: any): SlugResourceState {
	if (source === null || source === undefined) {
		return {present: false, destroyed: null, width: null, height: null};
	}
	// Sampler resources are TextureSources; a Texture has `.source`.
	const src = source.source !== undefined ? source.source : source;
	return {
		present: true,
		destroyed: typeof src.destroyed === 'boolean' ? src.destroyed : null,
		width: typeof src.width === 'number' ? src.width : null,
		height: typeof src.height === 'number' ? src.height : null
	};
}

function badResource(r: SlugResourceState): boolean {
	if (!r.present) return true;
	if (r.destroyed === true) return true;
	if (r.width === 0 || r.height === 0) return true;
	return false;
}

function emptySlot(pass: SlugSlotReport['pass']): SlugSlotReport {
	return {
		pass,
		present: false,
		meshInScene: false,
		meshDrawable: false,
		meshVisible: false,
		meshRenderable: false,
		meshWorldAlpha: 0,
		indexCount: 0,
		vertexBufferOk: false,
		indexBufferOk: false,
		curveSource: resourceState(null),
		bandSource: resourceState(null),
		fillGradientSource: resourceState(null),
		fillTextureSource: resourceState(null),
		slotGeneration: null,
		generationStale: false,
		uniforms: {},
		problems: []
	};
}

function inspectSlot(
	pass: SlugSlotReport['pass'],
	slot: any,
	parent: any,
	fontGeneration: number | null
): SlugSlotReport {
	if (!slot) return emptySlot(pass);

	const problems: string[] = [];
	const mesh = slot.mesh;
	const meshInScene =
		!!mesh && Array.isArray(parent.children) && parent.children.indexOf(mesh) >= 0;
	const meshVisible = !!mesh && mesh.visible !== false;
	const meshRenderable = !!mesh && mesh.renderable !== false;
	const meshWorldAlpha = mesh && typeof mesh.worldAlpha === 'number' ? mesh.worldAlpha : 1;
	const meshDrawable = meshVisible && meshRenderable && meshWorldAlpha > 0;

	const geom = slot.geometry;
	let indexCount = 0;
	if (geom && geom.indexBuffer && geom.indexBuffer.data) {
		// Upper bound: the live draw size set via setDataWithSize is a
		// private field that drifts across pixi patches, so report the
		// backing array length.
		indexCount = geom.indexBuffer.data.length;
	}

	const vertexBufferOk =
		!!slot.vertexBuffer && !!slot.vertexBuffer.data && slot.vertexBuffer.data.byteLength > 0;
	const indexBufferOk =
		!!slot.indexBuffer && !!slot.indexBuffer.data && slot.indexBuffer.data.byteLength > 0;

	const resources = (slot.shader && slot.shader.resources) || {};
	const curveSource = resourceState(resources.uCurveTexture);
	const bandSource = resourceState(resources.uBandTexture);
	const fillGradientSource = resourceState(resources.uFillGradient);
	const fillTextureSource = resourceState(resources.uFillTexture);

	const slotGeneration = typeof slot._gpuGeneration === 'number' ? slot._gpuGeneration : null;
	const generationStale =
		slotGeneration !== null && fontGeneration !== null && slotGeneration < fontGeneration;

	const ug = slot.uniforms && slot.uniforms.uniforms ? slot.uniforms.uniforms : {};
	const uniforms = {
		uSupersampleCount: ug.uSupersampleCount,
		uStrokeExpand: ug.uStrokeExpand,
		uStrokeAlphaStart: ug.uStrokeAlphaStart,
		uStrokeAlphaRate: ug.uStrokeAlphaRate,
		uFillMode: ug.uFillMode,
		uFillBoundsPx: ug.uFillBoundsPx ? Array.from(ug.uFillBoundsPx as Float32Array) : undefined
	};

	if (!meshInScene) problems.push('mesh is NOT a child of the SlugText (not on display list)');
	if (!meshVisible) problems.push('mesh.visible === false');
	if (!meshRenderable) problems.push('mesh.renderable === false');
	if (meshWorldAlpha <= 0) problems.push(`mesh.worldAlpha === ${meshWorldAlpha} (invisible)`);
	if (!vertexBufferOk) problems.push('vertex buffer missing or empty (geometry destroyed?)');
	if (!indexBufferOk) problems.push('index buffer missing or empty (geometry destroyed?)');
	if (badResource(curveSource))
		problems.push('uCurveTexture source missing/destroyed/zero-size — glyph data gone');
	if (badResource(bandSource))
		problems.push('uBandTexture source missing/destroyed/zero-size — band data gone');
	if (badResource(fillGradientSource))
		problems.push('uFillGradient source missing/destroyed (sampler must always be bound)');
	if (badResource(fillTextureSource))
		problems.push('uFillTexture source missing/destroyed (sampler must always be bound)');
	if (generationStale)
		problems.push(
			`slot generation ${slotGeneration} < font generation ${fontGeneration} — ` +
				'curve/band bindings point at DESTROYED sources (font grew; rebind missing)'
		);

	return {
		pass,
		present: true,
		meshInScene,
		meshDrawable,
		meshVisible,
		meshRenderable,
		meshWorldAlpha,
		indexCount,
		vertexBufferOk,
		indexBufferOk,
		curveSource,
		bandSource,
		fillGradientSource,
		fillTextureSource,
		slotGeneration,
		generationStale,
		uniforms,
		problems
	};
}

/**
 * Inspect a live v8 {@link SlugText} and report the GPU state of every
 * render pass. Read-only. Returns a structured {@link SlugDebugReport};
 * also prints a readable dump to the console unless `{silent: true}`.
 *
 * @param slugText  A pixi-slug v8 `SlugText` instance.
 * @param options   `{silent: true}` to suppress console output.
 */
export function slugDebugDump(slugText: SlugText, options: SlugDebugOptions = {}): SlugDebugReport {
	const t = slugText as any;

	const font = t._fontRef && typeof t._fontRef.deref === 'function' ? t._fontRef.deref() : null;
	const gpuCache = font ? (font.gpuCache as any) : null;
	const fontGeneration =
		gpuCache && typeof gpuCache.generation === 'number' ? gpuCache.generation : null;

	const slots: SlugSlotReport[] = [
		inspectSlot('shadow', t._shadowSlot, t, fontGeneration),
		inspectSlot('stroke', t._strokeSlot, t, fontGeneration),
		inspectSlot('fill', t._fillSlot, t, fontGeneration)
	];

	const problems: string[] = [];

	if (t.destroyed) problems.push('SlugText.destroyed === true');
	if (t.visible === false) problems.push('SlugText.visible === false');
	if (t.renderable === false) problems.push('SlugText.renderable === false');
	if (typeof t.worldAlpha === 'number' && t.worldAlpha <= 0)
		problems.push(`SlugText.worldAlpha === ${t.worldAlpha} (invisible — check parent alpha)`);
	if (!font) problems.push('Font not resolved (WeakRef deref returned null) — nothing to render');
	if (font && !gpuCache)
		problems.push('Font has no gpuCache — GPU resources never created (no draw has occurred yet?)');

	const anySlotPresent = slots.some((s) => s.present);
	const hasPendingPlan = !!t._pendingPlan;
	const onRenderAttached = !!t.onRender;
	if (!anySlotPresent && !hasPendingPlan)
		problems.push(
			'No live slots and no pending plan — empty text, no font, or rebuild produced nothing'
		);
	if (!anySlotPresent && hasPendingPlan)
		problems.push(
			'Pending plan exists but no slots attached yet — GPU attach has not run ' +
				'(onRender not firing? renderer never drew this object? parallel-compile still linking?)'
		);

	const fontCurve = resourceState(gpuCache ? gpuCache.curveTexture : null);
	const fontBand = resourceState(gpuCache ? gpuCache.bandTexture : null);
	const fontWhite = resourceState(gpuCache ? gpuCache.fallbackWhite : null);
	if (gpuCache && badResource(fontCurve))
		problems.push('font.gpuCache.curveTexture destroyed/zero-size — font GPU data released');
	if (gpuCache && badResource(fontBand))
		problems.push('font.gpuCache.bandTexture destroyed/zero-size — font GPU data released');

	for (const s of slots) {
		for (const p of s.problems) problems.push(`[${s.pass}] ${p}`);
	}

	const allResourcesHealthy =
		!!gpuCache &&
		!badResource(fontCurve) &&
		!badResource(fontBand) &&
		slots
			.filter((s) => s.present)
			.every(
				(s) =>
					s.meshInScene &&
					s.meshDrawable &&
					s.vertexBufferOk &&
					s.indexBufferOk &&
					!badResource(s.curveSource) &&
					!badResource(s.bandSource) &&
					!badResource(s.fillGradientSource) &&
					!badResource(s.fillTextureSource) &&
					!s.generationStale
			);

	let hint: string;
	if (problems.length === 0 && allResourcesHealthy && anySlotPresent) {
		hint =
			'All pixi-slug GPU resources are VALID and on the display list, yet nothing draws. ' +
			'This "all-clean-but-blank" combination most commonly means a DUPLICATE pixi.js — the ' +
			"slug mesh fails the renderer's instanceof check and its draw is never issued. Run " +
			'slugAssertPixiSingleton(slugText, renderer) FIRST. If that is clean, the next suspect ' +
			'is leaked GL state from your app — run slugAssertGlState(renderer) or inspect the slug ' +
			'drawElements call in Spector.js.';
	} else if (slots.some((s) => s.generationStale)) {
		hint =
			'A slot is bound to a font generation older than the font current generation. The ' +
			"font's curve/band texture sources were destroyed + recreated by a glyph grow and " +
			'this slot never rebound. _attachGpu normally rebinds next frame via ' +
			'_syncSlotToFontGeneration — if it stays stale, onRender is not firing for this object ' +
			'(culled? renderable=false? actually being rendered?).';
	} else if (problems.length > 0) {
		hint =
			'Resource-fault indicators found (see problems above): a resource is missing, ' +
			'destroyed, zero-size, or the object is not drawable. Something released or detached ' +
			"pixi-slug's GPU state. Fix the listed problems first, then re-check.";
	} else {
		hint = 'Inconclusive — see problems list and slot table.';
	}

	const report: SlugDebugReport = {
		ok: problems.length === 0,
		slugText: {
			destroyed: !!t.destroyed,
			visible: t.visible !== false,
			renderable: t.renderable !== false,
			worldAlpha: typeof t.worldAlpha === 'number' ? t.worldAlpha : 1,
			childCount: Array.isArray(t.children) ? t.children.length : 0,
			hasPendingPlan,
			onRenderAttached,
			fontResolved: !!font
		},
		font: {
			present: !!gpuCache,
			generation: fontGeneration,
			curveSource: fontCurve,
			bandSource: fontBand,
			fallbackWhiteSource: fontWhite
		},
		slots,
		problems,
		hint
	};

	if (!options.silent) printReport(report);
	return report;
}

function printReport(r: SlugDebugReport): void {
	/* eslint-disable no-console */
	console.group('%c[slugDebugDump]', 'color:#4ea1ff;font-weight:bold');
	console.log('SlugText:', r.slugText);
	console.log('Font GPU cache:', r.font);

	const rows = r.slots
		.filter((s) => s.present)
		.map((s) => ({
			pass: s.pass,
			inScene: s.meshInScene,
			drawable: s.meshDrawable,
			indices: s.indexCount,
			vbo: s.vertexBufferOk,
			ibo: s.indexBufferOk,
			curve: s.curveSource.destroyed === true ? 'DESTROYED' : s.curveSource.present ? 'ok' : 'MISSING',
			band: s.bandSource.destroyed === true ? 'DESTROYED' : s.bandSource.present ? 'ok' : 'MISSING',
			fillGrad:
				s.fillGradientSource.destroyed === true
					? 'DESTROYED'
					: s.fillGradientSource.present
						? 'ok'
						: 'MISSING',
			fillTex:
				s.fillTextureSource.destroyed === true
					? 'DESTROYED'
					: s.fillTextureSource.present
						? 'ok'
						: 'MISSING',
			gen: s.slotGeneration,
			stale: s.generationStale,
			fillMode: s.uniforms.uFillMode
		}));
	if (rows.length > 0 && typeof console.table === 'function') {
		console.table(rows);
	} else {
		console.log('Slots:', r.slots);
	}

	if (r.problems.length > 0) {
		console.group('%cProblems', 'color:#ff6b6b;font-weight:bold');
		for (const p of r.problems) console.log('•', p);
		console.groupEnd();
	} else {
		console.log('%cNo problems detected.', 'color:#51cf66');
	}

	console.log('%cHint:', 'font-weight:bold', r.hint);
	console.groupEnd();
	/* eslint-enable no-console */
}
