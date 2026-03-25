/**
 * Scalability Configuration
 * إعدادات التوسع والتعامل مع عدد كبير من المستخدمين
 */

const config = require('./env');
const logger = require('../utils/logger');

// إعدادات التوسع
const scalabilityConfig = {
    // Redis Cluster Configuration
    redisCluster: {
        enabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
        nodes: [
            {
                host: process.env.REDIS_NODE_1_HOST || 'localhost',
                port: parseInt(process.env.REDIS_NODE_1_PORT) || 6379,
                password: process.env.REDIS_PASSWORD
            },
            {
                host: process.env.REDIS_NODE_2_HOST || 'localhost',
                port: parseInt(process.env.REDIS_NODE_2_PORT) || 6380,
                password: process.env.REDIS_PASSWORD
            },
            {
                host: process.env.REDIS_NODE_3_HOST || 'localhost',
                port: parseInt(process.env.REDIS_NODE_3_PORT) || 6381,
                password: process.env.REDIS_PASSWORD
            }
        ],
        options: {
            enableReadyCheck: true,
            maxRedirections: 3,
            retryDelayOnFailover: 100,
            redisOptions: {
                connectTimeout: 5000,
                lazyConnect: true,
                maxRetriesPerRequest: 3
            }
        }
    },

    // MongoDB Sharding Configuration
    mongodbSharding: {
        enabled: process.env.MONGODB_SHARDING_ENABLED === 'true',
        shardCount: parseInt(process.env.MONGODB_SHARD_COUNT) || 3,
        replicaSetCount: parseInt(process.env.MONGODB_REPLICA_SET_COUNT) || 2,
        configServers: [
            process.env.MONGODB_CONFIG_SERVER_1 || 'mongodb://localhost:27017',
            process.env.MONGODB_CONFIG_SERVER_2 || 'mongodb://localhost:27018',
            process.env.MONGODB_CONFIG_SERVER_3 || 'mongodb://localhost:27019'
        ]
    },

    // Load Balancer Configuration
    loadBalancer: {
        enabled: process.env.LOAD_BALANCER_ENABLED === 'true',
        algorithm: process.env.LOAD_BALANCER_ALGORITHM || 'round-robin', // round-robin, least-connections, weighted
        servers: [
            {
                host: process.env.SERVER_1_HOST || 'localhost',
                port: parseInt(process.env.SERVER_1_PORT) || 3000,
                weight: parseInt(process.env.SERVER_1_WEIGHT) || 1
            },
            {
                host: process.env.SERVER_2_HOST || 'localhost',
                port: parseInt(process.env.SERVER_2_PORT) || 3001,
                weight: parseInt(process.env.SERVER_2_WEIGHT) || 1
            },
            {
                host: process.env.SERVER_3_HOST || 'localhost',
                port: parseInt(process.env.SERVER_3_PORT) || 3002,
                weight: parseInt(process.env.SERVER_3_WEIGHT) || 1
            }
        ],
        healthCheck: {
            enabled: true,
            interval: 30000, // 30 seconds
            timeout: 5000,   // 5 seconds
            retries: 3
        }
    },

    // Performance Optimization
    performance: {
        // Cache Configuration
        cache: {
            strategy: process.env.CACHE_STRATEGY || 'write-through', // write-through, write-behind, cache-aside
            ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
            maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000, // 1000 items
            compressionEnabled: process.env.CACHE_COMPRESSION_ENABLED === 'true'
        },

        // Connection Pooling
        connectionPool: {
            minConnections: parseInt(process.env.MIN_CONNECTIONS) || 5,
            maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 50,
            acquireTimeoutMillis: parseInt(process.env.ACQUIRE_TIMEOUT) || 30000,
            idleTimeoutMillis: parseInt(process.env.IDLE_TIMEOUT) || 30000,
            maxLifetimeMillis: parseInt(process.env.MAX_LIFETIME) || 1800000 // 30 minutes
        },

        // Rate Limiting
        rateLimiting: {
            enabled: process.env.RATE_LIMITING_ENABLED === 'true',
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
            skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
            skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true'
        },

        // Request Timeout
        timeouts: {
            connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT) || 30000,
            socketTimeout: parseInt(process.env.SOCKET_TIMEOUT) || 45000,
            serverSelectionTimeout: parseInt(process.env.SERVER_SELECTION_TIMEOUT) || 30000
        }
    },

    // Monitoring and Analytics
    monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        metrics: {
            responseTime: true,
            requestCount: true,
            errorRate: true,
            cacheHitRate: true,
            connectionPool: true,
            memoryUsage: true,
            cpuUsage: true
        },
        alerts: {
            highResponseTime: {
                enabled: true,
                threshold: parseInt(process.env.HIGH_RESPONSE_TIME_THRESHOLD) || 2000, // 2 seconds
                action: 'log'
            },
            highErrorRate: {
                enabled: true,
                threshold: parseFloat(process.env.HIGH_ERROR_RATE_THRESHOLD) || 0.05, // 5%
                action: 'log'
            },
            lowCacheHitRate: {
                enabled: true,
                threshold: parseFloat(process.env.LOW_CACHE_HIT_RATE_THRESHOLD) || 0.8, // 80%
                action: 'log'
            },
            connectionPoolExhaustion: {
                enabled: true,
                threshold: parseFloat(process.env.CONNECTION_POOL_THRESHOLD) || 0.9, // 90%
                action: 'log'
            }
        }
    }
};

// التحقق من إعدادات التوسع
const validateScalabilityConfig = () => {
    const warnings = [];
    const errors = [];

    // التحقق من Redis Cluster
    if (scalabilityConfig.redisCluster.enabled) {
        if (scalabilityConfig.redisCluster.nodes.length < 3) {
            warnings.push('Redis Cluster: يجب أن يكون هناك 3 nodes على الأقل');
        }
        
        for (let i = 0; i < scalabilityConfig.redisCluster.nodes.length; i++) {
            const node = scalabilityConfig.redisCluster.nodes[i];
            if (!node.host || !node.port) {
                errors.push(`Redis Node ${i + 1}: host و port مطلوبان`);
            }
        }
    }

    // التحقق من MongoDB Sharding
    if (scalabilityConfig.mongodbSharding.enabled) {
        if (scalabilityConfig.mongodbSharding.shardCount < 3) {
            warnings.push('MongoDB Sharding: يجب أن يكون هناك 3 shards على الأقل');
        }
        
        if (scalabilityConfig.mongodbSharding.replicaSetCount < 2) {
            warnings.push('MongoDB Sharding: يجب أن يكون هناك 2 replica sets على الأقل');
        }
    }

    // التحقق من Load Balancer
    if (scalabilityConfig.loadBalancer.enabled) {
        if (scalabilityConfig.loadBalancer.servers.length < 2) {
            warnings.push('Load Balancer: يجب أن يكون هناك 2 servers على الأقل');
        }
        
        let totalWeight = 0;
        for (let i = 0; i < scalabilityConfig.loadBalancer.servers.length; i++) {
            const server = scalabilityConfig.loadBalancer.servers[i];
            if (!server.host || !server.port) {
                errors.push(`Load Balancer Server ${i + 1}: host و port مطلوبان`);
            }
            totalWeight += server.weight || 0;
        }
        
        if (totalWeight === 0) {
            warnings.push('Load Balancer: يجب أن يكون هناك أوزان للخوادم');
        }
    }

    // التحقق من Performance Settings
    if (scalabilityConfig.performance.cache.maxSize < 100) {
        warnings.push('Cache: maxSize يجب أن يكون 100 على الأقل');
    }

    if (scalabilityConfig.performance.connectionPool.maxConnections < 20) {
        warnings.push('Connection Pool: maxConnections يجب أن يكون 20 على الأقل');
    }

    if (scalabilityConfig.performance.rateLimiting.maxRequests < 100) {
        warnings.push('Rate Limiting: maxRequests يجب أن يكون 100 على الأقل');
    }

    // عرض النتائج
    if (errors.length > 0) {
        logger.error('❌ أخطاء في إعدادات التوسع:', errors);
        return false;
    }

    if (warnings.length > 0) {
        logger.warn('⚠️ تحذيرات في إعدادات التوسع:', warnings);
    }

    logger.info('✅ إعدادات التوسع صالحة');
    return true;
};

// الحصول على توصيات التوسع
const getScalabilityRecommendations = (currentUsers, expectedGrowth) => {
    const recommendations = [];
    
    // توصيات Redis
    if (currentUsers > 1000) {
        recommendations.push({
            component: 'Redis',
            recommendation: 'تفعيل Redis Cluster',
            reason: 'أكثر من 1000 مستخدم يتطلبون Redis Cluster للأداء الأمثل',
            config: {
                REDIS_CLUSTER_ENABLED: 'true',
                REDIS_NODE_1_HOST: 'redis-server-1',
                REDIS_NODE_1_PORT: '6379',
                REDIS_NODE_2_HOST: 'redis-server-2',
                REDIS_NODE_2_PORT: '6379',
                REDIS_NODE_3_HOST: 'redis-server-3',
                REDIS_NODE_3_PORT: '6379'
            }
        });
    }

    // توصيات MongoDB
    if (currentUsers > 5000) {
        recommendations.push({
            component: 'MongoDB',
            recommendation: 'تفعيل MongoDB Sharding',
            reason: 'أكثر من 5000 مستخدم يتطلبون Sharding لتوزيع البيانات',
            config: {
                MONGODB_SHARDING_ENABLED: 'true',
                MONGODB_SHARD_COUNT: '3',
                MONGODB_REPLICA_SET_COUNT: '2'
            }
        });
    }

    // توصيات Load Balancer
    if (currentUsers > 2000) {
        recommendations.push({
            component: 'Load Balancer',
            recommendation: 'تفعيل Load Balancer',
            reason: 'أكثر من 2000 مستخدم يتطلبون توزيع الحمل على عدة خوادم',
            config: {
                LOAD_BALANCER_ENABLED: 'true',
                LOAD_BALANCER_ALGORITHM: 'least-connections',
                SERVER_1_HOST: 'app-server-1',
                SERVER_1_PORT: '3000',
                SERVER_2_HOST: 'app-server-2',
                SERVER_2_PORT: '3000'
            }
        });
    }

    // توصيات الأداء
    if (expectedGrowth > 0.5) { // 50% نمو شهري
        recommendations.push({
            component: 'Performance',
            recommendation: 'تحسين إعدادات الأداء',
            reason: 'نمو عالي يتطلب تحسينات الأداء',
            config: {
                CACHE_TTL: '600', // 10 minutes
                CACHE_MAX_SIZE: '5000',
                MAX_CONNECTIONS: '100',
                RATE_LIMIT_MAX_REQUESTS: '2000'
            }
        });
    }

    return recommendations;
};

// مراقبة الأداء
const monitorPerformance = () => {
    if (!scalabilityConfig.monitoring.enabled) {
        return;
    }

    // مراقبة استخدام الذاكرة
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    
    if (memUsageMB > 1000) { // 1GB
        logger.warn(`⚠️ استخدام الذاكرة العالي: ${memUsageMB.toFixed(2)} MB`);
    }

    // مراقبة حمل المعالج
    const cpuUsage = process.cpuUsage();
    if (cpuUsage.user > 1000000) { // 1 second in microseconds
        logger.warn(`⚠️ استخدام المعالج العالي: ${cpuUsage.user} microseconds`);
    }

    // يمكن إضافة المزيد من مقاييس الأداء هنا
    logger.info(`📊 حالة الأداء: Memory: ${memUsageMB.toFixed(2)} MB, CPU: ${cpuUsage.user} μs`);
};

module.exports = {
    scalabilityConfig,
    validateScalabilityConfig,
    getScalabilityRecommendations,
    monitorPerformance
};
