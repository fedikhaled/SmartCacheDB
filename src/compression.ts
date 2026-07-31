import { gzipSync, gunzipSync } from 'zlib';

export const compress = (data: unknown): string => {
    let serialized: string | undefined;
    try {
        serialized = JSON.stringify(data);
    } catch {
        throw new TypeError('Cache values must be JSON-serializable');
    }

    if (serialized === undefined) {
        throw new TypeError('Cache values must be JSON-serializable');
    }

    return gzipSync(serialized).toString('base64');
};

export const decompress = (data: string): unknown => JSON.parse(gunzipSync(Buffer.from(data, 'base64')).toString());
