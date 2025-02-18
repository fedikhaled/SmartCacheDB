import { gzipSync, gunzipSync } from 'zlib';

export const compress = (data) => gzipSync(JSON.stringify(data)).toString('base64');
export const decompress = (data) => JSON.parse(gunzipSync(Buffer.from(data, 'base64')).toString());
