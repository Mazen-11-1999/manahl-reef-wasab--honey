/**
 * Redis Cluster Utility
 * نظام Redis Cluster للتوسع الأفقي
 */

const config = require('../config/env');
const logger = require('./logger');
const { scalabilityConfig } = require('../config/scalability');

let clusterClient = null;
let clusterInitialized = false;

/**
 * تهيئة Redis Cluster
 */
const initRedisCluster = async () => {
    if (!scalabilityConfig.redisCluster.enabled) {
        logger.info('🔄 Redis Cluster غير مفعّل - استخدام Redis عادي');
        return false;
    }

    if (clusterInitialized) {
        return clusterClient;
    }

    try {
        const Redis = require('ioredis');
        
        // إنشاء Redis Cluster
        clusterClient = new Redis.Cluster(scalabilityConfig.redisCluster.nodes, {
            ...scalabilityConfig.redisCluster.options,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            enableReadyCheck: true
        });

        // معالجة الأحداث
        clusterClient.on('connect', () => {
            logger.info('✅ تم الاتصال بـ Redis Cluster');
            clusterInitialized = true;
        });

        clusterClient.on('error', (err) => {
            logger.error('❌ خطأ في Redis Cluster:', err);
            clusterInitialized = false;
        });

        clusterClient.on('node error', (err, node) => {
            logger.error(`❌ خطأ في Redis Node ${node.options.host}:${node.options.port}:`, err);
        });

        clusterClient.on('close', () => {
            logger.warn('⚠️ تم إغلاق اتصال Redis Cluster');
            clusterInitialized = false;
        });

        // اختبار الاتصال
        await clusterClient.ping();
        logger.info('✅ Redis Cluster يعمل بشكل صحيح');
        
        return clusterClient;
    } catch (error) {
        logger.error('❌ فشل تهيئة Redis Cluster:', error);
        clusterInitialized = false;
        return null;
    }
};

/**
 * الحصول على قيمة من Redis Cluster
 */
const get = async (key) => {
    if (!clusterClient || !clusterInitialized) {
        return null;
    }

    try {
        const value = await clusterClient.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        logger.error('Redis Cluster GET error:', error);
        return null;
    }
};

/**
 * حفظ قيمة في Redis Cluster
 */
const set = async (key, value, ttl = 300) => {
    if (!clusterClient || !clusterInitialized) {
        return false;
    }

    try {
        const serialized = JSON.stringify(value);
        await clusterClient.setex(key, ttl, serialized);
        return true;
    } catch (error) {
        logger.error('Redis Cluster SET error:', error);
        return false;
    }
};

/**
 * حذف قيمة من Redis Cluster
 */
const del = async (key) => {
    if (!clusterClient || !clusterInitialized) {
        return false;
    }

    try {
        await clusterClient.del(key);
        return true;
    } catch (error) {
        logger.error('Redis Cluster DEL error:', error);
        return false;
    }
};

/**
 * حذف قيم بنمط من Redis Cluster
 */
const delPattern = async (pattern) => {
    if (!clusterClient || !clusterInitialized) {
        return false;
    }

    try {
        const keys = await clusterClient.keys(pattern);
        if (keys.length > 0) {
            await clusterClient.del(...keys);
        }
        return true;
    } catch (error) {
        logger.error('Redis Cluster DEL pattern error:', error);
        return false;
    }
};

/**
 * التحقق من وجود مفتاح في Redis Cluster
 */
const exists = async (key) => {
    if (!clusterClient || !clusterInitialized) {
        return false;
    }

    try {
        const result = await clusterClient.exists(key);
        return result === 1;
    } catch (error) {
        logger.error('Redis Cluster EXISTS error:', error);
        return false;
    }
};

/**
 * الحصول على إحصائيات Redis Cluster
 */
const getStats = async () => {
    if (!clusterClient || !clusterInitialized) {
        return { type: 'none', error: 'Redis Cluster not initialized' };
    }

    try {
        const nodes = clusterClient.nodes();
        const stats = {
            type: 'redis-cluster',
            nodes: nodes.map(node => ({
                host: node.options.host,
                port: node.options.port,
                status: node.status
            })),
            memory: await clusterClient.info('memory'),
            stats: await clusterClient.info('stats')
        };
        
        return stats;
    } catch (error) {
        logger.error('Redis Cluster stats error:', error);
        return { type: 'none', error: error.message };
    }
};

/**
 * إعادة تعيين Redis Cluster
 */
const reset = async () => {
    if (clusterClient) {
        try {
            await clusterClient.flushall();
            logger.info('✅ تم إعادة تعيين Redis Cluster');
        } catch (error) {
            logger.error('❌ خطأ في إعادة تعيين Redis Cluster:', error);
        }
    }
};

/**
 * إغلاق Redis Cluster
 */
const close = async () => {
    if (clusterClient) {
        try {
            await clusterClient.quit();
            logger.info('🔌 تم إغلاق Redis Cluster');
        } catch (error) {
            logger.error('❌ خطأ في إغلاق Redis Cluster:', error);
        }
        clusterInitialized = false;
        clusterClient = null;
    }
};

/**
 * التحقق من حالة Redis Cluster
 */
const isHealthy = async () => {
    if (!clusterClient || !clusterInitialized) {
        return false;
    }

    try {
        const result = await clusterClient.ping();
        return result === 'PONG';
    } catch (error) {
        logger.error('Redis Cluster health check error:', error);
        return false;
    }
};

/**
 * الحصول على معلومات الأداء
 */
const getPerformanceMetrics = async () => {
    if (!clusterClient || !clusterInitialized) {
        return null;
    }

    try {
        const info = await clusterClient.info();
        const lines = info.split('\r\n');
        const metrics = {};
        
        lines.forEach(line => {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                metrics[key] = value;
            }
        });

        return {
            connected_clients: parseInt(metrics.connected_clients) || 0,
            used_memory: parseInt(metrics.used_memory) || 0,
            used_memory_human: metrics.used_memory_human || '0B',
            total_commands_processed: parseInt(metrics.total_commands_processed) || 0,
            instantaneous_ops_per_sec: parseFloat(metrics.instantaneous_ops_per_sec) || 0,
            keyspace_hits: parseInt(metrics.keyspace_hits) || 0,
            keyspace_misses: parseInt(metrics.keyspace_misses) || 0,
            hit_rate: metrics.keyspace_hits && metrics.keyspace_misses ? 
                (metrics.keyspace_hits / (metrics.keyspace_hits + metrics.keyspace_misses) * 100).toFixed(2) : 0
        };
    } catch (error) {
        logger.error('Redis Cluster performance metrics error:', error);
        return null;
    }
};

// تهيئة Redis Cluster عند تحميل الوحدة
if (scalabilityConfig.redisCluster.enabled) {
    initRedisCluster().catch(error => {
        logger.error('❌ فشل تهيئة Redis Cluster عند التحميل:', error);
    });
}

module.exports = {
    initRedisCluster,
    get,
    set,
    del,
    delPattern,
    exists,
    getStats,
    reset,
    close,
    isHealthy,
    getPerformanceMetrics
};
