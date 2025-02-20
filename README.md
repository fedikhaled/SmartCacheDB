# 🚀 SmartCacheDB - High-Performance Adaptive Caching for Node.js  
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  

**SmartCacheDB** is a high-performance caching system for Node.js that **dynamically optimizes cache expiration** based on access patterns.  
It supports **in-memory storage (LRU)**, **Redis**, and **database caching**, reducing database load and improving performance.  
Developers can now **choose storage types dynamically** for more flexibility!  

---

## 📌 **Features**
✅ **Optimized Cache Expiration** - No need to manually set TTL!  
✅ **Supports Redis, In-Memory, & Database** - Choose storage dynamically!  
✅ **Auto-Invalidation** - Cache updates automatically when data changes.  
✅ **LRU Cache Support** - Uses Least Recently Used (LRU) caching.  
✅ **Simple API** - Works as a drop-in replacement for Redis/Memcached.  
✅ **WebSocket-Based Cache Invalidation** - Real-time cache updates when data changes.  
✅ **Persistent Storage Support** - Keep cache even after server restarts.  
✅ **Compression Support** - Reduce memory usage with Gzip compression.  
✅ **Multi-Backend Support** - Use multiple storage backends together (e.g., Memory + Redis + Database).  
✅ **Hybrid Caching** - Combine different cache strategies dynamically.  
✅ **Multi-Key Operations** - Batch set, get, and delete for performance.  
✅ **Cache Tags** - Group-based cache invalidation.  
✅ **Auto Refresh** - Preload cache before expiration.  
✅ **JSON & Buffer Storage** - Store structured and binary data efficiently.  
✅ **Efficient Testing Suite** - Ensures reliability with Jest tests.  

---

## 📦 **Installation**
Install the package using `npm`:
```sh
npm install smartcachedb
```
or using `yarn`:
```sh
yarn add smartcachedb
```

### **Installing Redis (Required for Redis Mode)**
#### **🔹 Windows**
```sh
wsl --install
sudo apt update
sudo apt install redis-server
sudo service redis-server start
redis-cli ping
```

#### **🔹 Linux (Ubuntu/Debian)**
```sh
sudo apt update
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis
redis-cli ping
```

#### **🔹 macOS**
```sh
brew install redis
brew services start redis
redis-cli ping
```

#### **🔹 Docker (Cross-Platform Solution)**
```sh
docker run --name redis -d -p 6379:6379 redis
```

---

## 🚀 **Usage Examples**

### **1️⃣ Basic Set & Get Example**
```typescript
await cache.set("user:1", { name: "Alice" });
const user = await cache.get("user:1");
console.log(user);
```

### **2️⃣ Choosing Storage Dynamically**
```typescript
const cacheMemory = new SmartCacheDB(['memory']);
const cacheRedis = new SmartCacheDB(['redis'], { host: 'localhost', port: 6379 });
const cacheHybrid = new SmartCacheDB(['memory', 'redis', 'database']);
```

### **3️⃣ Multi-Key Operations**
```typescript
await cache.setMany({ "user:1": "Alice", "user:2": "Bob" });
const users = await cache.getMany(["user:1", "user:2"]);
console.log(users);
await cache.deleteMany(["user:1", "user:2"]);
```

### **4️⃣ Cache Tags (Group-based invalidation)**
```typescript
await cache.setWithTag("post:100", { title: "Hello World" }, ["posts"]);
await cache.setWithTag("post:101", { title: "Another Post" }, ["posts"]);
await cache.deleteByTag("posts");
```

### **5️⃣ Auto-Refreshing Cache**
```typescript
await cache.setWithAutoRefresh("stock:price", 100, 30, async () => {
    return Math.random() * 100;
});
```

### **6️⃣ JSON & Buffer Storage**
```typescript
await cache.setJSON("config", { theme: "dark", layout: "grid" });
const config = await cache.getJSON("config");
console.log(config);
await cache.setBuffer("file:data", Buffer.from("Hello, world!"));
const file = await cache.getBuffer("file:data");
console.log(file.toString());
```

### **7️⃣ Compression Support**
```typescript
const cache = new SmartCacheDB(['memory']);
await cache.set('analytics:data', { users: 10000, traffic: 'high' }, { compress: true });
const analytics = await cache.get('analytics:data');
console.log(analytics);
```

### **8️⃣ WebSocket-Based Cache Invalidation**
```typescript
import WebSocket from 'ws';
const cache = new SmartCacheDB(['memory', 'redis'], { enableWebSocket: true });
await cache.set('live:data', { status: 'active' });
const ws = new WebSocket('ws://localhost:8080');
ws.on('message', (data) => console.log("Cache invalidation message received:", data));
await cache.delete('live:data');
```

### **9️⃣ API Caching with Express.js**
```typescript
import express from 'express';
const app = express();
const cache = new SmartCacheDB(['memory', 'redis'], { redisConfig: { host: 'localhost', port: 6379 } });
app.get('/data', async (req, res) => {
    const cachedData = await cache.get('api:data');
    if (cachedData) return res.json({ source: 'cache', data: cachedData });
    const freshData = { message: 'Fetched from API', timestamp: Date.now() };
    await cache.set('api:data', freshData, { ttl: 600 });
    res.json({ source: 'API', data: freshData });
});
app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## **🛠️ API Methods**
| Method | Description |
|--------|------------|
| `set(key, value, ttl?)` | Stores a value with optional TTL |
| `get(key)` | Retrieves a value |
| `delete(key)` | Deletes a value |
| `clear()` | Clears the entire cache |
| `setMany(keysValues, ttl?)` | Stores multiple key-value pairs with optional TTL |
| `getMany(keys)` | Retrieves multiple values |
| `deleteMany(keys)` | Deletes multiple keys |
| `setWithTag(key, value, tags, ttl?)` | Stores a value and assigns tags for group invalidation |
| `deleteByTag(tag)` | Deletes all cache entries associated with a specific tag |
| `setWithAutoRefresh(key, value, ttl, refreshCallback)` | Stores a value and auto-refreshes before expiration |
| `setJSON(key, json, ttl?)` | Stores a JSON object in cache |
| `getJSON(key)` | Retrieves and parses a stored JSON object |
| `setBuffer(key, buffer, ttl?)` | Stores binary data in cache |
| `getBuffer(key)` | Retrieves binary data from cache |

---


## 📜 **License**
This project is **open-source** and available under the **MIT License**.

---

## 📞 **Contact**
For questions or feature requests, feel free to reach out:
- **GitHub Issues:** [Open an issue](https://github.com/fedikhaled/SmartCacheDB/issues)
- **Email:** fedikhaled01@gmail.com 

---

### 🚀 **Star this project if you like it!** ⭐

