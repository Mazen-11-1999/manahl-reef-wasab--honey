/**
 * Cache Utility
 * نظام التخزين المؤقت - يدعم Redis و In-Memory Cache
 */

const config = require('../config/env');
const logger = require('./logger');

let cacheClient = null;
let memoryCache = null;

// محاولة الاتصال بـ Redis (مع معالجة أفضل للأخطاء)
let redisInitialized = false;
let redisInitAttempted = false;

const initRedis = async () => {
    // إذا تمت المحاولة بالفعل وفشلت، لا تحاول مرة أخرى
    if (redisInitAttempted && !redisInitialized) {
        return false;
    }
    
    redisInitAttempted = true;
    
    try {
        if (config.redisHost && config.redisPort) {
            const redis = require('redis');
            const client = redis.createClient({
                socket: {
                    host: config.redisHost,
                    port: config.redisPort,
                    connectTimeout: 2000, // 2 ثانية فقط
                    reconnectStrategy: false // لا تحاول إعادة الاتصال تلقائياً
                },
                password: config.redisPassword || undefined
            });

            // معالجة الأخطاء - سجل مرة واحدة فقط وتوقف
            let errorLogged = false;
            client.on('error', (err) => {
                if (!errorLogged) {
                    // تجاهل ECONNREFUSED - سنستخدم memory cache
                    if (err.code !== 'ECONNREFUSED') {
                        logger.warn('Redis error, using memory cache:', err.code || err.message);
                    }
                    errorLogged = true;
                }
                // إغلاق العميل لمنع إعادة المحاولة
                if (client && client.isOpen) {
                    client.quit().catch(() => {});
                }
                cacheClient = null;
                redisInitialized = false;
            });

            client.on('connect', () => {
                logger.info('✅ Connected to Redis');
                redisInitialized = true;
                errorLogged = false;
            });

            // محاولة الاتصال مع timeout
            try {
                await Promise.race([
                    client.connect(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
                    )
                ]);
                
                if (client.isOpen) {
                    cacheClient = client;
                    redisInitialized = true;
                    return true;
                }
            } catch (connectError) {
                // تجاهل أخطاء الاتصال - سنستخدم memory cache
                if (client && client.isOpen) {
                    client.quit().catch(() => {});
                }
                cacheClient = null;
                redisInitialized = false;
            }
        }
    } catch (error) {
        // تجاهل جميع الأخطاء - memory cache يعمل بالفعل
        cacheClient = null;
        redisInitialized = false;
    }
    return false;
};

// تهيئة Memory Cache كبديل
const initMemoryCache = () => {
    const NodeCache = require('node-cache');
    memoryCache = new NodeCache({
        stdTTL: 3600, // 1 hour default
        checkperiod: 600, // Check for expired keys every 10 minutes
        useClones: false
    });
    
    logger.info('✅ Memory cache initialized');
};

// تهيئة Cache
const initCache = async () => {
    // تهيئة memory cache أولاً (دائماً متاح)
    initMemoryCache();
    
    // محاولة الاتصال بـ Redis (اختياري - لا يمنع تشغيل النظام)
    try {
        await initRedis();
    } catch (error) {
        // تجاهل الأخطاء - memory cache يعمل بالفعل
    }
};

/**
 * الحصول على قيمة من Cache
 */
const get = async (key) => {
    try {
        if (cacheClient) {
            // Redis
            const value = await cacheClient.get(key);
            return value ? JSON.parse(value) : null;
        } else if (memoryCache) {
            // Memory Cache
            return memoryCache.get(key) || null;
        }
    } catch (error) {
        logger.error('Cache get error:', error);
        return null;
    }
    return null;
};

/**
 * حفظ قيمة في Cache
 */
const set = async (key, value, ttl = 3600) => {
    try {
        const serialized = JSON.stringify(value);
        
        if (cacheClient) {
            // Redis (TTL بالثواني)
            await cacheClient.setEx(key, ttl, serialized);
        } else if (memoryCache) {
            // Memory Cache (TTL بالثواني)
            memoryCache.set(key, value, ttl);
        }
        return true;
    } catch (error) {
        logger.error('Cache set error:', error);
        return false;
    }
};

/**
 * حذف قيمة من Cache
 */
const del = async (key) => {
    try {
        if (cacheClient) {
            await cacheClient.del(key);
        } else if (memoryCache) {
            memoryCache.del(key);
        }
        return true;
    } catch (error) {
        logger.error('Cache delete error:', error);
        return false;
    }
};

/**
 * حذف جميع القيم التي تطابق pattern
 */
const delPattern = async (pattern) => {
    try {
        if (cacheClient) {
            const keys = await cacheClient.keys(pattern);
            if (keys.length > 0) {
                await cacheClient.del(keys);
            }
        } else if (memoryCache) {
            const keys = memoryCache.keys();
            const regex = new RegExp(pattern.replace('*', '.*'));
            keys.forEach(key => {
                if (regex.test(key)) {
                    memoryCache.del(key);
                }
            });
        }
        return true;
    } catch (error) {
        logger.error('Cache delete pattern error:', error);
        return false;
    }
};

/**
 * التحقق من وجود مفتاح في Cache
 */
const exists = async (key) => {
    try {
        if (cacheClient) {
            return await cacheClient.exists(key) === 1;
        } else if (memoryCache) {
            return memoryCache.has(key);
        }
        return false;
    } catch (error) {
        logger.error('Cache exists error:', error);
        return false;
    }
};

/**
 * إعادة تعيين Cache
 */
const flush = async () => {
    try {
        if (cacheClient) {
            await cacheClient.flushDb();
        } else if (memoryCache) {
            memoryCache.flushAll();
        }
        return true;
    } catch (error) {
        logger.error('Cache flush error:', error);
        return false;
    }
};

/**
 * الحصول على إحصائيات Cache
 */
const getStats = async () => {
    try {
        if (cacheClient) {
            const info = await cacheClient.info('stats');
            return {
                type: 'redis',
                info: info
            };
        } else if (memoryCache) {
            const stats = memoryCache.getStats();
            return {
                type: 'memory',
                keys: stats.keys,
                hits: stats.hits,
                misses: stats.misses,
                ksize: stats.ksize,
                vsize: stats.vsize
            };
        }
        return { type: 'none' };
    } catch (error) {
        logger.error('Cache stats error:', error);
        return { type: 'none', error: error.message };
    }
};

// تهيئة Cache عند تحميل الوحدة
if (config.nodeEnv !== 'test') {
    initCache();
}

module.exports = {
    initCache,
    get,
    set,
    del,
    delPattern,
    exists,
    flush,
    getStats,
    isRedisAvailable: () => cacheClient !== null,
    isMemoryCacheAvailable: () => memoryCache !== null
};











