/**
 * Public surface for shared math primitives. Layout is version-specific
 * (lives in `src/v8/slug/math/containers/` and corresponding v7/v6
 * paths) because it composes PIXI Containers. Shared here: the node
 * type, the builder, the init shape, and the math-font registration.
 */
export type {MathNode, MathNodeKind, MathNodeStyle} from './math/node';
export type {MathBuilder, MathInput} from './math/builder';
export {mathBuilder} from './math/builder';
export type {MathTextInit, MathTextStyleOptions} from './math/init';
export {mathFontFallback} from './math/font/registry';
export {MATH_FALLBACK_ALIAS} from './math/font/stub';
