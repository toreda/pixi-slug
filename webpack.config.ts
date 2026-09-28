import fs from 'fs';
import path from 'path';
import type { Configuration, Compiler } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';

// webpack-cli 7 may load .ts configs as ESM (where ROOT is unavailable)
// or CJS (where import.meta is unavailable). Use process.cwd() which works
// in both — webpack is always invoked from the project root via pnpm scripts.
const ROOT = process.cwd();

/**
 * Webpack plugin that removes only the previous bundle artifacts (index.js
 * and its sourcemap) from the output directory before each build. Leaves
 * sibling .d.ts declarations and other files in place so independent build
 * steps (tsc --emitDeclarationOnly) aren't clobbered when webpack reruns.
 */
class CleanOutputPlugin {
	apply(compiler: Compiler): void {
		compiler.hooks.beforeRun.tapAsync('CleanOutputPlugin', (comp, callback) => {
			const outputPath = comp.options.output.path;
			if (!outputPath || !fs.existsSync(outputPath)) {
				callback();
				return;
			}

			const targets = ['index.js', 'index.js.map'];
			let remaining = targets.length;
			let firstErr: NodeJS.ErrnoException | null = null;
			for (const name of targets) {
				fs.rm(path.join(outputPath, name), { force: true }, (err) => {
					if (err && !firstErr) firstErr = err;
					if (--remaining === 0) callback(firstErr ?? undefined);
				});
			}
		});
	}
}

/**
 * Webpack plugin that emits a `package.json` containing only a `type` field
 * next to the bundle. Makes each output dir self-describing so Node (and
 * TypeScript's node16/nodenext resolution) treats `index.js` / `index.d.ts`
 * as the right module system regardless of the root package's `type` field.
 */
class ModuleTypeMarkerPlugin {
	private readonly moduleType: 'commonjs' | 'module';

	constructor(moduleType: 'commonjs' | 'module') {
		this.moduleType = moduleType;
	}

	apply(compiler: Compiler): void {
		compiler.hooks.thisCompilation.tap('ModuleTypeMarkerPlugin', (compilation) => {
			compilation.hooks.processAssets.tap(
				{
					name: 'ModuleTypeMarkerPlugin',
					stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
				},
				() => {
					const json = JSON.stringify({ type: this.moduleType }, null, '\t') + '\n';
					compilation.emitAsset('package.json', new compiler.webpack.sources.RawSource(json));
				}
			);
		});
	}
}

type PixiVersion = 'v6' | 'v7' | 'v8';
type BuildTarget = 'dev' | 'prod';
type ModuleFormat = 'cjs' | 'esm';

const VERSIONS: PixiVersion[] = ['v6', 'v7', 'v8'];
const FORMATS: ModuleFormat[] = ['cjs', 'esm'];

/**
 * Externals for the ESM bundle. Emitted as static `import` statements so the
 * consumer's bundler (or Node) resolves the same pixi.js copy the app uses.
 */
const PIXI_ESM_EXTERNALS: Record<PixiVersion, Record<string, string>> = {
	v8: {
		'pixi.js': 'pixi.js'
	},
	v7: {
		'@pixi/constants': '@pixi/constants',
		'@pixi/core': '@pixi/core',
		'@pixi/display': '@pixi/display',
		'@pixi/graphics': '@pixi/graphics',
		'@pixi/math': '@pixi/math',
		'@pixi/mesh': '@pixi/mesh',
		'@pixi/ticker': '@pixi/ticker'
	},
	v6: {
		'@pixi/constants': '@pixi/constants',
		'@pixi/core': '@pixi/core',
		'@pixi/display': '@pixi/display',
		'@pixi/graphics': '@pixi/graphics',
		'@pixi/math': '@pixi/math',
		'@pixi/mesh': '@pixi/mesh',
		'@pixi/ticker': '@pixi/ticker'
	}
};

/**
 * Externals for the CJS (UMD) bundle. `root` keeps the bundle usable from a
 * plain `<script>` tag alongside a global `PIXI`.
 */
const PIXI_EXTERNALS: Record<PixiVersion, Configuration['externals']> = {
	v8: {
		'pixi.js': {
			commonjs: 'pixi.js',
			commonjs2: 'pixi.js',
			root: 'PIXI'
		}
	},
	v7: {
		'@pixi/constants': {
			commonjs: '@pixi/constants',
			commonjs2: '@pixi/constants',
			root: 'PIXI'
		},
		'@pixi/core': {
			commonjs: '@pixi/core',
			commonjs2: '@pixi/core',
			root: 'PIXI'
		},
		'@pixi/display': {
			commonjs: '@pixi/display',
			commonjs2: '@pixi/display',
			root: 'PIXI'
		},
		'@pixi/graphics': {
			commonjs: '@pixi/graphics',
			commonjs2: '@pixi/graphics',
			root: 'PIXI'
		},
		'@pixi/math': {
			commonjs: '@pixi/math',
			commonjs2: '@pixi/math',
			root: 'PIXI'
		},
		'@pixi/mesh': {
			commonjs: '@pixi/mesh',
			commonjs2: '@pixi/mesh',
			root: 'PIXI'
		},
		'@pixi/ticker': {
			commonjs: '@pixi/ticker',
			commonjs2: '@pixi/ticker',
			root: 'PIXI'
		}
	},
	v6: {
		'@pixi/constants': {
			commonjs: '@pixi/constants',
			commonjs2: '@pixi/constants',
			root: 'PIXI'
		},
		'@pixi/core': {
			commonjs: '@pixi/core',
			commonjs2: '@pixi/core',
			root: 'PIXI'
		},
		'@pixi/display': {
			commonjs: '@pixi/display',
			commonjs2: '@pixi/display',
			root: 'PIXI'
		},
		'@pixi/graphics': {
			commonjs: '@pixi/graphics',
			commonjs2: '@pixi/graphics',
			root: 'PIXI'
		},
		'@pixi/math': {
			commonjs: '@pixi/math',
			commonjs2: '@pixi/math',
			root: 'PIXI'
		},
		'@pixi/mesh': {
			commonjs: '@pixi/mesh',
			commonjs2: '@pixi/mesh',
			root: 'PIXI'
		},
		'@pixi/ticker': {
			commonjs: '@pixi/ticker',
			commonjs2: '@pixi/ticker',
			root: 'PIXI'
		}
	}
};

/**
 * Build a webpack config for a specific version, environment, and module format.
 * CJS output is a UMD bundle (works with `require()` and `<script>` tags);
 * ESM output is a native ES module bundle.
 */
function buildConfig(version: PixiVersion, target: BuildTarget, format: ModuleFormat): Configuration {
	const isProd = target === 'prod';
	const isEsm = format === 'esm';
	const outputPath = path.resolve(ROOT, 'dist', version, format);

	return {
		name: `${version}:${format}:${target}`,
		mode: isProd ? 'production' : 'development',
		devtool: isProd ? false : 'source-map',
		entry: path.resolve(ROOT, 'src', version, 'index.ts'),
		output: isEsm
			? {
				path: outputPath,
				filename: 'index.js',
				module: true,
				library: {
					type: 'module'
				}
			}
			: {
				path: outputPath,
				filename: 'index.js',
				library: {
					name: 'pixiSlug',
					type: 'umd'
				},
				globalObject: 'this'
			},
		experiments: isEsm ? { outputModule: true } : undefined,
		plugins: [
			new CleanOutputPlugin(),
			new ModuleTypeMarkerPlugin(isEsm ? 'module' : 'commonjs')
		],
		resolve: {
			extensions: ['.ts', '.js', '.glsl']
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: {
						loader: 'ts-loader',
						options: {
							configFile: path.resolve(ROOT, `tsconfig.${version}.json`),
							compilerOptions: {
								declaration: false,
								declarationMap: false,
								removeComments: false
							}
						}
					},
					exclude: /node_modules/
				},
				{
					test: /\.glsl$/,
					type: 'asset/source'
				}
			]
		},
		externalsType: isEsm ? 'module' : undefined,
		externals: isEsm ? PIXI_ESM_EXTERNALS[version] : PIXI_EXTERNALS[version],
		optimization: {
			minimize: isProd,
			minimizer: isProd
				? [
					new TerserPlugin({
						terserOptions: {
							mangle: false,
							output: {
								comments: true
							}
						},
						extractComments: false
					})
				]
				: []
		}
	};
}

interface WebpackEnv {
	version?: string;
	target?: string;
	format?: string;
}

export default (_wpEnv: unknown, argv: { env?: WebpackEnv }): Configuration | Configuration[] => {
	const version = argv.env?.version;
	const target: BuildTarget = argv.env?.target === 'prod' ? 'prod' : 'dev';
	// Optional single-format filter. `examples:watch` builds only cjs (the UMD
	// bundle the example pages load) since all six version/format configs in
	// one process exceed Node's default heap.
	const formats = FORMATS.includes(argv.env?.format as ModuleFormat)
		? [argv.env?.format as ModuleFormat]
		: FORMATS;

	if (version === 'all') {
		return VERSIONS.flatMap((v) => formats.map((f) => buildConfig(v, target, f)));
	}

	if (version && VERSIONS.includes(version as PixiVersion)) {
		return formats.map((f) => buildConfig(version as PixiVersion, target, f));
	}

	return formats.map((f) => buildConfig('v8', 'dev', f));
};
