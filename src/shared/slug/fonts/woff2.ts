export async function slugWoff2Decompress(woff2Bytes: Uint8Array): Promise<Uint8Array> {
	const {default: woff2Decompress} = await import(/* webpackMode: "eager" */ 'woff2-encoder/decompress');
	const result = await woff2Decompress(woff2Bytes);
	if (!result || result.byteLength === 0) {
		throw new Error('WOFF2 decompression failed');
	}
	return result;
}
