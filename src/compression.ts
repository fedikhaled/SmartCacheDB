import { gzipSync, gunzipSync } from 'zlib';

export const compress = (data: unknown): string => gzipSync(JSON.stringify(data)).toString('base64');
export const decompress = (data: string): unknown => JSON.parse(gunzipSync(Buffer.from(data, 'base64')).toString());
