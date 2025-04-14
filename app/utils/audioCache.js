// utils/audioCache.js

// A simple in-memory cache for audio URLs
class AudioCache {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    // Set a cache entry
    set(key, audioUrl) {
        // If cache is full, remove oldest entry
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        // Add new entry with timestamp
        this.cache.set(key, {
            url: audioUrl,
            timestamp: Date.now()
        });
    }

    // Get a cache entry if it exists
    get(key) {
        const entry = this.cache.get(key);
        if (entry) {
            // Update timestamp when accessed
            entry.timestamp = Date.now();
            return entry.url;
        }
        return null;
    }

    // Check if a key exists in the cache
    has(key) {
        return this.cache.has(key);
    }

    // Clear the entire cache
    clear() {
        this.cache.clear();
    }

    // Remove a specific entry
    delete(key) {
        this.cache.delete(key);
    }

    // Get cache size
    get size() {
        return this.cache.size;
    }
}

// Create singleton instance
const audioCache = new AudioCache();

// Function to generate a cache key from text and voice
export function generateCacheKey(text, voice) {
    return `${voice || 'default'}_${text}`;
}

// Export the cache instance
export default audioCache;