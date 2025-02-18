export class DatabaseStorage {
    private db: any;

    constructor(config: any) {
        this.db = config.connection || null; // Ensure db is defined
    }

    async set(key: string, value: any) {
        if (!this.db) return;
        await this.db.query(`INSERT INTO cache (key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=?`, [key, value, value]);
    }

    async get(key: string) {
        if (!this.db) return null;
        const result = await this.db.query(`SELECT value FROM cache WHERE key=?`, [key]);
        return result.length ? result[0].value : null;
    }

    async delete(key: string) {
        if (!this.db) return;
        await this.db.query(`DELETE FROM cache WHERE key=?`, [key]);
    }

    async clear() {
        if (!this.db) return;
        await this.db.query(`DELETE FROM cache`);
    }
}
