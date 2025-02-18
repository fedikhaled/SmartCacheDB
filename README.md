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
✓ should store and retrieve a value
✓ should delete a value
✓ should clear all values
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

