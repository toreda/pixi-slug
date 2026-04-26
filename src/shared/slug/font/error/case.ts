/** Distinct failure cases in the font resolver. */
export type SlugFontErrorCase =
	| 'unknownInput'
	| 'fontFaceNoUrl'
	| 'emptyFontFaceArray'
	| 'loadFailed'
	| 'unsupportedFormat'
	| 'aliasNotFound'
	| 'aliasCollision'
	| 'emptyInput';

