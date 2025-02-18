# 🚀 SmartCacheDB - AI-Powered Adaptive Caching for Node.js  
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  
**SmartCacheDB** is an AI-powered caching system for Node.js that **dynamically optimizes cache expiration** based on access patterns.  
It supports **in-memory storage (LRU)** and **Redis**, reducing database load and improving performance.  

---

## 📌 **Features**
✅ **AI-Optimized Cache Expiration** - No need to manually set TTL!  
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

## 🚀 **Usage**
### **1️⃣ Basic Usage**
```typescript
import SmartCacheDB from 'smartcachedb';

// Initialize cache (default: in-memory)
const cache = new SmartCacheDB(['memory']);

// Store a value
await cache.set('user:1', { name: "Alice", age: 30 });

// Retrieve value
const value = await cache.get('user:1');
console.log(value); // { name: "Alice", age: 30 }

// Delete a value
await cache.delete('user:1');

// Clear cache
await cache.clear();
```

---

### **2️⃣ Using Redis as Storage**
```typescript
import SmartCacheDB from 'smartcachedb';

// Initialize with Redis
const cache = new SmartCacheDB(['redis'], { host: 'localhost', port: 6379 });

// Store and retrieve data
await cache.set('product:123', { name: "Laptop", price: 1200 });
const product = await cache.get('product:123');

console.log(product); // { name: "Laptop", price: 1200 }
```

---

### **3️⃣ Hybrid Caching (Memory + Redis)**
```typescript
const cache = new SmartCacheDB(['memory', 'redis'], { redisConfig: { host: 'localhost', port: 6379 } });

// Store data in hybrid mode
await cache.set('session:456', { token: "abcd1234" });

// Retrieve from cache
const session = await cache.get('session:456');
console.log(session);
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
Expected output:
```
PASS  src/tests/cache.test.ts
✓ should store and retrieve a value in memory (9 ms)
✓ should store and retrieve a value in Redis
✓ should delete a value from cache (11 ms)
✓ should clear all values from cache (3 ms)
✓ should handle non-existing keys gracefully (2 ms)
✓ should handle setting objects in cache (1 ms)
✓ should store and retrieve compressed values
✓ should store values with expiration (2007 ms)
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

