import type { DatabaseConfig, DatabaseConnection } from '../types';

export class DatabaseStorage {
    private db: DatabaseConnection | null;

    constructor(config: DatabaseConfig) {
        this.db = config.connection ?? null;
    }

    async set(key: string, value: string): Promise<void> {
        if (!this.db) return;
        await this.db.query(`INSERT INTO cache (key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=?`, [key, value, value]);
    }

    async get(key: string): Promise<string | null> {
        if (!this.db) return null;
        const result = await this.db.query(`SELECT value FROM cache WHERE key=?`, [key]);
        const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
        if (!Array.isArray(rows) || rows.length === 0) return null;

        const firstRow: unknown = rows[0];
        if (typeof firstRow !== 'object' || firstRow === null || !('value' in firstRow)) return null;

        const value = (firstRow as { value: unknown }).value;
        if (typeof value === 'string') return value;
        if (Buffer.isBuffer(value)) return value.toString();
        return null;
    }

    async delete(key: string): Promise<void> {
        if (!this.db) return;
        await this.db.query(`DELETE FROM cache WHERE key=?`, [key]);
    }

    async clear(): Promise<void> {
        if (!this.db) return;
        await this.db.query(`DELETE FROM cache`);
    }
}
