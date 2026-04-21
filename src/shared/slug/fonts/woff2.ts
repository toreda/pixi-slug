import woff2Decompress from 'woff2-encoder/decompress';

export async function slugWoff2Decompress(woff2Bytes: Uint8Array): Promise<Uint8Array> {
	const result = await woff2Decompress(woff2Bytes);
	if (!result || result.byteLength === 0) {
		throw new Error('WOFF2 decompression failed');
	}
	return result;
}
