import fs from 'fs';
import path from 'path';
import type { Configuration, Compiler } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';

// webpack-cli 7 may load .ts configs as ESM (where ROOT is unavailable)
// or CJS (where import.meta is unavailable). Use process.cwd() which works
// in both — webpack is always invoked from the project root via pnpm scripts.
const ROOT = process.cwd();

/**
 * Webpack plugin that removes all contents of the output directory before
 * each build. Only cleans if the directory already exists.
 */
class CleanOutputPlugin {
	apply(compiler: Compiler): void {
		compiler.hooks.beforeRun.tapAsync('CleanOutputPlugin', (comp, callback) => {
			const outputPath = comp.options.output.path;
			if (!outputPath || !fs.existsSync(outputPath)) {
				callback();
				return;
			}

			fs.rm(outputPath, { recursive: true, force: true }, (err) => {
				if (err) {
					callback(err);
					return;
				}
				fs.mkdir(outputPath, { recursive: true }, (mkdirErr) => {
					callback(mkdirErr ?? undefined);
				});
			});
		});
	}
}

type PixiVersion = 'v6' | 'v7' | 'v8';
type BuildTarget = 'dev' | 'prod';

const VERSIONS: PixiVersion[] = ['v6', 'v7', 'v8'];

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
 * Build a webpack config for a specific version and environment.
 */
function buildConfig(version: PixiVersion, target: BuildTarget): Configuration {
	const isProd = target === 'prod';

	return {
		name: `${version}:${target}`,
		mode: isProd ? 'production' : 'development',
		devtool: isProd ? false : 'source-map',
		entry: path.resolve(ROOT, 'src', version, 'index.ts'),
		output: {
			path: path.resolve(ROOT, 'dist', version),
			filename: 'index.js',
			library: {
				name: 'pixiSlug',
				type: 'umd'
			},
			globalObject: 'this',
		},
		plugins: [
			new CleanOutputPlugin()
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
		externals: PIXI_EXTERNALS[version],
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
}

export default (_wpEnv: unknown, argv: { env?: WebpackEnv }): Configuration | Configuration[] => {
	const version = argv.env?.version;
	const target: BuildTarget = argv.env?.target === 'prod' ? 'prod' : 'dev';

	if (version === 'all') {
		return VERSIONS.map((v) => buildConfig(v, target));
	}

	if (version && VERSIONS.includes(version as PixiVersion)) {
		return buildConfig(version as PixiVersion, target);
	}

	return buildConfig('v8', 'dev');
};
