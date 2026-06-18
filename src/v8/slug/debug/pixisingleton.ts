import {Mesh, Container, VERSION} from 'pixi.js';
import type {WebGLRenderer} from 'pixi.js';
import type {SlugText} from '../text';

/**
 * Detect whether the running app has loaded MORE THAN ONE copy of
 * `pixi.js`.
 *
 * This is the highest-leverage SlugText failure to catch, and the one the
 * resource/GL-state diagnostics ({@link slugDebugDump},
 * {@link slugAssertGlState}) CANNOT see. When two pixi copies are present,
 * the app's renderer comes from one copy and pixi-slug's `Mesh` / `Shader`
 * / `Texture` / `UniformGroup` come from the other. pixi's render pipe uses
 * `instanceof` / constructor identity to recognize renderable objects, so
 * the slug mesh is silently skipped — its draw call is never issued. Every
 * JS resource is valid and the GL context is clean; nothing draws. That
 * "all-clean-but-blank" combination is the fingerprint this guard turns
 * into a definite answer.
 *
 * How it tells:
 *  1. **Module marker.** On first load this module stamps a marker on
 *     `globalThis` recording the pixi `VERSION` pixi-slug linked against
 *     and a unique per-module-instance token. A second pixi-slug module
 *     instance (or a second call site importing a different pixi) sees the
 *     marker already there with a different token → duplicate load.
 *  2. **VERSION compare.** Compares the `VERSION` string pixi-slug imported
 *     against the one reachable from the renderer's pixi. Different strings
 *     = different copies (or genuinely different versions — both fatal).
 *  3. **Constructor identity (the decisive test).** When a `SlugText` is
 *     provided, checks that its live slug mesh is `instanceof` the `Mesh`
 *     class pixi-slug imported, and that the renderer recognizes the same
 *     `Container` lineage. A failure here is the exact mechanism that
 *     breaks rendering — not a proxy for it.
 *
 * Read-only. Returns a structured report; logs to the console unless
 * `{silent: true}`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const GLOBAL_MARKER_KEY = '__pixiSlugPixiSingletonMarker__';

interface PixiSingletonMarker {
	/** pixi VERSION string this module instance linked against. */
	version: string;
	/** Unique token per pixi-slug module instance (detects 2+ slug copies). */
	token: object;
	/**
	 * The `Mesh` constructor this pixi-slug module instance imported. A
	 * second instance whose imported `Mesh` is a DIFFERENT constructor is
	 * the definitive cross-copy signal — it is the exact class identity the
	 * renderer's `instanceof` checks against.
	 */
	meshCtor: unknown;
}

// One token per evaluation of THIS module. If pixi-slug itself is loaded
// twice (e.g. once from source, once from node_modules), each gets its own
// token and the marker check below fires.
const MODULE_TOKEN: object = {};

/** Guards the auto-check so it logs at most once per pixi-slug instance. */
let autoCheckRan = false;

function readMarker(): PixiSingletonMarker | null {
	const g = globalThis as any;
	return (g[GLOBAL_MARKER_KEY] as PixiSingletonMarker) ?? null;
}

function writeMarker(marker: PixiSingletonMarker): void {
	(globalThis as any)[GLOBAL_MARKER_KEY] = marker;
}

export interface SlugPixiSingletonReport {
	/** True when exactly one pixi.js copy is in play (as far as we can tell). */
	ok: boolean;
	/** True when a duplicate pixi.js was positively detected. */
	duplicateDetected: boolean;
	/** pixi VERSION string pixi-slug imported. */
	slugLinkedVersion: string;
	/** pixi VERSION reachable from the renderer's objects, if obtainable. */
	rendererVersion: string | null;
	/** True when a second pixi-slug module instance was detected via the global marker. */
	multipleSlugModules: boolean;
	/** instanceof check results (only populated when a SlugText is passed). */
	meshInstanceofMesh: boolean | null;
	meshInstanceofContainer: boolean | null;
	problems: string[];
	hint: string;
}

function reachRendererVersion(renderer: WebGLRenderer | null | undefined): string | null {
	if (!renderer) return null;
	const r = renderer as any;
	// pixi attaches no direct VERSION to the renderer, but the constructor
	// chain belongs to the renderer's pixi copy. We can't read a string
	// from it reliably; the decisive signal is the constructor-identity
	// test below. Return null here and let instanceof carry the verdict.
	// (Kept as a hook in case a future pixi exposes renderer.VERSION.)
	if (typeof r.VERSION === 'string') return r.VERSION;
	return null;
}

function firstSlugMesh(slugText: SlugText | null | undefined): any {
	if (!slugText) return null;
	const t = slugText as any;
	const slot = t._fillSlot ?? t._strokeSlot ?? t._shadowSlot;
	return slot ? slot.mesh : null;
}

/**
 * Check for a duplicate `pixi.js` load. Pass the SlugText (and optionally
 * the renderer) for the strongest, constructor-identity-based verdict;
 * called with no arguments it still runs the module-marker and
 * self-consistency checks.
 *
 * @param slugText  A v8 `SlugText` whose live mesh constructor identity is
 *                  tested against pixi-slug's imported `Mesh`. Optional but
 *                  strongly recommended — it is the decisive test.
 * @param renderer  The app's `WebGLRenderer`. Optional.
 * @param options   `{silent: true}` to suppress console output.
 */
export function slugAssertPixiSingleton(
	slugText?: SlugText | null,
	renderer?: WebGLRenderer | null,
	options: {silent?: boolean} = {}
): SlugPixiSingletonReport {
	const problems: string[] = [];

	// --- 1. Module marker: detect a second pixi-slug module instance ---
	const existing = readMarker();
	let multipleSlugModules = false;
	if (existing) {
		if (existing.token !== MODULE_TOKEN) {
			multipleSlugModules = true;
			problems.push(
				'A second pixi-slug module instance is loaded (the global singleton marker was ' +
					`stamped by a different copy). pixi-slug linked pixi ${existing.version} there vs ` +
					`${VERSION} here. Two pixi-slug copies almost always drag in two pixi copies.`
			);
			if (existing.version !== VERSION) {
				problems.push(
					`The two pixi-slug copies linked DIFFERENT pixi versions: ${existing.version} ` +
						`vs ${VERSION}.`
				);
			}
		}
	} else {
		writeMarker({version: VERSION, token: MODULE_TOKEN, meshCtor: Mesh});
	}

	// --- 2. VERSION compare against the renderer's pixi (best-effort) ---
	const rendererVersion = reachRendererVersion(renderer);
	if (rendererVersion !== null && rendererVersion !== VERSION) {
		problems.push(
			`Renderer's pixi VERSION (${rendererVersion}) differs from pixi-slug's linked pixi ` +
				`VERSION (${VERSION}) — two different pixi.js copies are loaded.`
		);
	}

	// --- 3. Constructor identity: the decisive test ---
	let meshInstanceofMesh: boolean | null = null;
	let meshInstanceofContainer: boolean | null = null;
	const mesh = firstSlugMesh(slugText);
	if (mesh) {
		meshInstanceofMesh = mesh instanceof Mesh;
		meshInstanceofContainer = mesh instanceof Container;
		if (!meshInstanceofMesh) {
			problems.push(
				"A live slug mesh is NOT `instanceof` pixi-slug's imported `Mesh` class. This is the " +
					'EXACT mechanism that makes the renderer skip the slug mesh: the mesh was built ' +
					"with a different pixi copy's Mesh than the one pixi-slug imports. Definitive dual-pixi."
			);
		}
		if (!meshInstanceofContainer) {
			problems.push(
				"A live slug mesh is NOT `instanceof` pixi-slug's imported `Container` — confirms the " +
					'mesh originates from a different pixi copy.'
			);
		}
		// Cross-check against the renderer's pixi if we can reach a class
		// from it. pixi's WebGLRenderer doesn't expose its Mesh class
		// directly, so the instanceof checks above (against pixi-slug's
		// own classes) are the reliable signal — a slug mesh that fails
		// `instanceof slugMesh.Mesh` cannot be recognized by ANY pipe.
	} else if (slugText) {
		problems.push(
			'SlugText has no live mesh yet (no slot attached) — pass it after at least one render ' +
				'frame so the constructor-identity test can run. Marker/VERSION checks still ran.'
		);
	}

	const duplicateDetected =
		multipleSlugModules ||
		(rendererVersion !== null && rendererVersion !== VERSION) ||
		meshInstanceofMesh === false;

	let hint: string;
	if (duplicateDetected) {
		hint =
			'DUPLICATE pixi.js DETECTED. This is almost certainly why SlugText renders nothing while ' +
			'every resource looks valid. FIX: dedupe pixi.js to a single copy — pnpm/npm `overrides`, ' +
			"or a bundler `resolve.alias` pinning `pixi.js` to one path. Run `pnpm why pixi.js` / " +
			'`npm ls pixi.js` to find the second copy. Ensure pixi-slug’s peer range is satisfied ' +
			'by that single copy so no second one installs.';
	} else if (mesh) {
		hint =
			'Single pixi.js copy confirmed (mesh passes constructor-identity against pixi-slug’s ' +
			'imported classes). If SlugText is still blank, it is NOT a dual-pixi problem — use ' +
			'slugDebugDump() (resources) and slugAssertGlState() (GL state).';
	} else {
		hint =
			'No duplicate detected by marker/VERSION, but the decisive constructor-identity test did ' +
			'not run (no live slug mesh provided). Re-run after a render frame, passing the SlugText, ' +
			'for a definitive answer.';
	}

	const report: SlugPixiSingletonReport = {
		ok: !duplicateDetected,
		duplicateDetected,
		slugLinkedVersion: VERSION,
		rendererVersion,
		multipleSlugModules,
		meshInstanceofMesh,
		meshInstanceofContainer,
		problems,
		hint
	};

	if (!options.silent) {
		/* eslint-disable no-console */
		if (duplicateDetected) {
			console.group('%c[slugAssertPixiSingleton] DUPLICATE pixi.js', 'color:#ff6b6b;font-weight:bold');
			for (const p of problems) console.log('•', p);
			console.log('Details:', {
				slugLinkedVersion: report.slugLinkedVersion,
				rendererVersion: report.rendererVersion,
				multipleSlugModules: report.multipleSlugModules,
				meshInstanceofMesh: report.meshInstanceofMesh,
				meshInstanceofContainer: report.meshInstanceofContainer
			});
			console.log('%cHint:', 'font-weight:bold', report.hint);
			console.groupEnd();
		} else {
			console.log(
				'%c[slugAssertPixiSingleton]',
				'color:#51cf66;font-weight:bold',
				report.problems.length ? report.problems : 'no duplicate pixi.js detected',
				report.hint
			);
		}
		/* eslint-enable no-console */
	}

	return report;
}

/**
 * One-time, renderer-free self-check called automatically the first time
 * pixi-slug builds a mesh. Detects a duplicate `pixi.js` load WITHOUT the
 * consumer having to know about {@link slugAssertPixiSingleton}, and emits
 * a single `console.error` if one is found — turning the otherwise-silent
 * "valid resources but blank text" failure into a clear, actionable
 * message at the moment the first SlugText renders.
 *
 * Detection is purely identity-based and side-effect-light:
 *  - On first call it stamps a global marker carrying pixi-slug's linked
 *    pixi `VERSION` and the `Mesh` constructor it imported.
 *  - If the marker already exists from a DIFFERENT pixi-slug module
 *    instance whose imported `Mesh` is a different constructor, two pixi
 *    copies are loaded — the renderer's `instanceof` will skip slug meshes.
 *
 * This does NOT flag a peer-version mismatch on its own — a single pixi
 * copy at any supported version is fine and stays silent. It fires only on
 * an actual duplicate (two distinct `Mesh` constructors / module
 * instances). The error guides the consumer to dedupe pixi.js and points
 * at {@link slugAssertPixiSingleton} for a full report.
 *
 * Idempotent: runs its console output at most once per pixi-slug instance.
 */
export function slugAutoCheckPixiSingleton(): void {
	if (autoCheckRan) return;
	autoCheckRan = true;

	const existing = readMarker();
	if (!existing) {
		writeMarker({version: VERSION, token: MODULE_TOKEN, meshCtor: Mesh});
		return;
	}

	// Marker present. Same module instance (same token) → single copy, fine.
	if (existing.token === MODULE_TOKEN) return;

	// Different pixi-slug module instance. The decisive question is whether
	// its imported Mesh constructor differs from ours — that is the exact
	// identity the renderer compares. Same constructor (deduped pixi, two
	// slug copies sharing one pixi) is benign for rendering; different
	// constructor is the fatal dual-pixi case.
	const differentMesh = existing.meshCtor !== Mesh;
	if (!differentMesh) return;

	/* eslint-disable no-console */
	console.error(
		'[pixi-slug] DUPLICATE pixi.js DETECTED.\n' +
			`  pixi-slug is linked against two different pixi.js copies ` +
			`(versions: ${existing.version} and ${VERSION}).\n` +
			'  SlugText meshes built with one copy fail the renderer\'s instanceof check against the\n' +
			'  other, so they are silently skipped — text will not render even though all GPU\n' +
			'  resources are valid.\n' +
			'  FIX: dedupe pixi.js to a single copy. In webpack add an exact-match alias to your\n' +
			"  app config: resolve.alias = { 'pixi.js$': require('path').resolve(__dirname,\n" +
			"  'node_modules/pixi.js') }  (Vite/esbuild: the equivalent resolve.alias). Then run\n" +
			'  `pnpm why pixi.js` / `npm ls pixi.js` to locate the second copy.\n' +
			'  For a full diagnostic call slugAssertPixiSingleton(slugText, renderer).'
	);
	/* eslint-enable no-console */
}
