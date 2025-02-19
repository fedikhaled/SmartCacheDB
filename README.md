# 🚀 SmartCacheDB - High-Performance Adaptive Caching for Node.js  
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  
**SmartCacheDB** is a high-performance caching system for Node.js that **dynamically optimizes cache expiration** based on access patterns.  
It supports **in-memory storage (LRU)** and **Redis**, reducing database load and improving performance.  

---

## 📌 **Features**
✅ **Optimized Cache Expiration** - No need to manually set TTL!  
✅ **Supports Redis & In-Memory** - Easily switch between storage types.  
✅ **Auto-Invalidation** - Cache updates automatically when data changes.  
✅ **LRU Cache Support** - Uses Least Recently Used (LRU) caching.  
✅ **Simple API** - Works as a drop-in replacement for Redis/Memcached.  
✅ **WebSocket-Based Cache Invalidation** - Real-time cache updates when data changes.  
✅ **Persistent Storage Support** - Keep cache even after server restarts.  
✅ **Compression Support** - Reduce memory usage with Gzip compression.  
✅ **Multi-Backend Support** - Use multiple storage backends together (e.g., Memory + Redis).  
✅ **Hybrid Caching** - Combine different cache strategies dynamically.  
✅ **Efficient Testing Suite** - Ensures reliability with Jest tests.  

---

## 📦 **Installation**
### **1️⃣ Installing SmartCacheDB**
Install the package using `npm`:
```sh
npm install smartcachedb
```
or using `yarn`:
```sh
yarn add smartcachedb
```

### **2️⃣ Installing Redis (Required for Redis Mode)**
#### **🔹 Windows**
If you're using Windows, install Redis via **WSL (Windows Subsystem for Linux)**:
```sh
wsl --install
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```
Check if Redis is running:
```sh
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

### **1️⃣ Basic Usage - In-Memory Caching**
```typescript
import SmartCacheDB from 'smartcachedb';

const cache = new SmartCacheDB(['memory']);
await cache.set('user:1', { name: 'Alice', age: 30 });
const user = await cache.get('user:1');
console.log(user);
```

### **2️⃣ Using Redis as Storage**
```typescript
const cache = new SmartCacheDB(['redis'], { host: 'localhost', port: 6379 });
await cache.set('session:123', { token: 'abcdef' }, { ttl: 300 });
const session = await cache.get('session:123');
console.log(session);
```

### **3️⃣ Hybrid Caching (Memory + Redis)**
```typescript
const cache = new SmartCacheDB(['memory', 'redis'], { redisConfig: { host: 'localhost', port: 6379 } });
await cache.set('order:789', { items: 3, total: 100 });
const order = await cache.get('order:789');
console.log(order);
```

### **4️⃣ Compression Support**
```typescript
const cache = new SmartCacheDB(['memory']);
await cache.set('analytics:data', { users: 10000, traffic: 'high' }, { compress: true });
const analytics = await cache.get('analytics:data');
console.log(analytics);
```

### **5️⃣ WebSocket-Based Cache Invalidation**
```typescript
import WebSocket from 'ws';
const cache = new SmartCacheDB(['memory', 'redis'], { enableWebSocket: true });
await cache.set('live:data', { status: 'active' });
const ws = new WebSocket('ws://localhost:8080');
ws.on('message', (data) => console.log("Cache invalidation message received:", data));
await cache.delete('live:data');
```

### **6️⃣ API Caching with Express.js**
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

---

## 🧪 **Running Tests**
Run Jest tests using:
```sh
npm test
```

---

## 📜 **License**
This project is **open-source** and available under the **MIT License**.

---

## 🌟 **Contributing**
Contributions are welcome! To contribute:
1. **Fork the repository**
2. **Create a new branch** (`git checkout -b feature-name`)
3. **Commit your changes** (`git commit -m "Added new feature"`)
4. **Push to GitHub** (`git push origin feature-name`)
5. **Submit a Pull Request**

---

## 📞 **Contact**
For questions or feature requests, feel free to reach out:
- **GitHub Issues:** [Open an issue](https://github.com/fedikhaled/SmartCacheDB)
- **Email:** fedikhaled01@gmail.com**

---

### 🚀 **Star this project if you like it!** ⭐

