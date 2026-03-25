/**
 * MongoDB Sharding Configuration
 * نظام تقسيم قاعدة البيانات للتوسع الأفقي
 */

const config = require('./env');
const logger = require('../utils/logger');
const { scalabilityConfig } = require('./scalability');

const mongoose = require('mongoose');

/**
 * إعدادات Sharding
 */
const shardingConfig = {
    enabled: scalabilityConfig.mongodbSharding.enabled,
    shardCount: scalabilityConfig.mongodbSharding.shardCount,
    replicaSetCount: scalabilityConfig.mongodbSharding.replicaSetCount,
    configServers: scalabilityConfig.mongodbSharding.configServers,
    
    // Shard Keys
    shardKeys: {
        users: 'phone', // تقسيم المستخدمين حسب رقم الهاتف
        orders: 'orderId', // تقسيم الطلبات حسب رقم الطلب
        products: 'category', // تقسيم المنتجات حسب الفئة
        analytics: 'date' // تقسيم التحليلات حسب التاريخ
    },
    
    // Shard Configuration
    shards: [
        {
            name: 'shard1',
            host: process.env.SHARD_1_HOST || 'localhost',
            port: parseInt(process.env.SHARD_1_PORT) || 27017,
            replicaSet: 'rs1'
        },
        {
            name: 'shard2',
            host: process.env.SHARD_2_HOST || 'localhost',
            port: parseInt(process.env.SHARD_2_PORT) || 27018,
            replicaSet: 'rs2'
        },
        {
            name: 'shard3',
            host: process.env.SHARD_3_HOST || 'localhost',
            port: parseInt(process.env.SHARD_3_PORT) || 27019,
            replicaSet: 'rs3'
        }
    ],
    
    // Config Server Configuration
    configServer: {
        host: process.env.CONFIG_SERVER_HOST || 'localhost',
        port: parseInt(process.env.CONFIG_SERVER_PORT) || 27019,
        replicaSet: 'configRS'
    }
};

/**
 * تهيئة MongoDB Sharding
 */
const initSharding = async () => {
    if (!shardingConfig.enabled) {
        logger.info('🔄 MongoDB Sharding غير مفعّل - استخدام MongoDB عادي');
        return false;
    }

    try {
        logger.info('🔄 بدء تهيئة MongoDB Sharding...');
        
        // الاتصال بـ Config Server
        const configServerUri = `mongodb://${shardingConfig.configServer.host}:${shardingConfig.configServer.port}`;
        await mongoose.connect(configServerUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // إنشاء Config Database
        const configDB = mongoose.connection.db;
        
        // إضافة Shards
        for (const shard of shardingConfig.shards) {
            try {
                await configDB.adminCommand({
                    addShard: `${shard.replicaSet}/${shard.host}:${shard.port}`
                });
                logger.info(`✅ تم إضافة Shard: ${shard.name}`);
            } catch (error) {
                logger.error(`❌ خطأ في إضافة Shard ${shard.name}:`, error);
            }
        }

        // تمكين Sharding للمجموعات
        await enableShardingForCollections(configDB);
        
        logger.info('✅ تم تهيئة MongoDB Sharding بنجاح');
        return true;
    } catch (error) {
        logger.error('❌ فشل تهيئة MongoDB Sharding:', error);
        return false;
    }
};

/**
 * تمكين Sharding للمجموعات
 */
const enableShardingForCollections = async (db) => {
    const collections = [
        { name: 'users', shardKey: shardingConfig.shardKeys.users },
        { name: 'orders', shardKey: shardingConfig.shardKeys.orders },
        { name: 'products', shardKey: shardingConfig.shardKeys.products },
        { name: 'analytics', shardKey: shardingConfig.shardKeys.analytics }
    ];

    for (const collection of collections) {
        try {
            await db.adminCommand({
                shardCollection: `${db.databaseName}.${collection.name}`,
                key: collection.shardKey
            });
            logger.info(`✅ تم تمكين Sharding للمجموعة: ${collection.name} (${collection.shardKey})`);
        } catch (error) {
            logger.error(`❌ خطأ في تمكين Sharding للمجموعة ${collection.name}:`, error);
        }
    }
};

/**
 * الحصول على Shard المحدد
 */
const getShardForKey = async (key, collectionName) => {
    if (!shardingConfig.enabled) {
        return null;
    }

    try {
        const result = await mongoose.connection.db.adminCommand({
            data: `${mongoose.connection.name}.${collectionName}`,
            key: key,
            showDiskLocs: true
        });

        if (result.ok && result.shards && result.shards.length > 0) {
            return result.shards[0]; // Shard الذي يحتوي على المفتاح
        }
        
        return null;
    } catch (error) {
        logger.error('❌ خطأ في الحصول على Shard:', error);
        return null;
    }
};

/**
 * التحقق من حالة Sharding
 */
const checkShardingStatus = async () => {
    if (!shardingConfig.enabled) {
        return { enabled: false };
    }

    try {
        const result = await mongoose.connection.db.adminCommand({
            listShards: 1
        });

        const shardsStatus = result.shards ? result.shards.map(shard => ({
            name: shard._id,
            host: shard.host,
            state: shard.state
        })) : [];

        return {
            enabled: true,
            shards: shardsStatus,
            shardCount: shardsStatus.length
        };
    } catch (error) {
        logger.error('❌ خطأ في فحص حالة Sharding:', error);
        return { enabled: false, error: error.message };
    }
};

/**
 * موازنة Shards
 */
const balanceShards = async () => {
    if (!shardingConfig.enabled) {
        return false;
    }

    try {
        logger.info('🔄 بدء موازنة Shards...');
        
        const result = await mongoose.connection.db.adminCommand({
            balancerStart: 1,
            balancerState: 1
        });

        if (result.ok) {
            logger.info('✅ تم بدء موازنة Shards');
            return true;
        } else {
            logger.error('❌ فشل بدء موازنة Shards');
            return false;
        }
    } catch (error) {
        logger.error('❌ خطأ في موازنة Shards:', error);
        return false;
    }
};

/**
 * إضافة Shard جديد
 */
const addShard = async (shardConfig) => {
    if (!shardingConfig.enabled) {
        return false;
    }

    try {
        const result = await mongoose.connection.db.adminCommand({
            addShard: `${shardConfig.replicaSet}/${shardConfig.host}:${shardConfig.port}`
        });

        if (result.ok) {
            logger.info(`✅ تم إضافة Shard جديد: ${shardConfig.replicaSet}`);
            return true;
        } else {
            logger.error('❌ فشل إضافة Shard جديد');
            return false;
        }
    } catch (error) {
        logger.error('❌ خطأ في إضافة Shard:', error);
        return false;
    }
};

/**
 * إزالة Shard
 */
const removeShard = async (shardName) => {
    if (!shardingConfig.enabled) {
        return false;
    }

    try {
        const result = await mongoose.connection.db.adminCommand({
            removeShard: shardName
        });

        if (result.ok) {
            logger.info(`✅ تم إزالة Shard: ${shardName}`);
            return true;
        } else {
            logger.error('❌ فشل إزالة Shard');
            return false;
        }
    } catch (error) {
        logger.error('❌ خطأ في إزالة Shard:', error);
        return false;
    }
};

/**
 * الحصول على إحصائيات Sharding
 */
const getShardingStats = async () => {
    if (!shardingConfig.enabled) {
        return { enabled: false };
    }

    try {
        const shardsStatus = await checkShardingStatus();
        const stats = {
            enabled: true,
            totalShards: shardsStatus.shardCount || 0,
            shards: shardsStatus.shards || [],
            databases: []
        };

        // الحصول على معلومات كل Shard
        for (const shard of shardsStatus.shards) {
            try {
                const shardStats = await mongoose.connection.db.adminCommand({
                    listCollections: 1,
                    filter: { name: { $regex: `^${shard.name}\\.` } }
                });

                stats.databases.push({
                    name: shard.name,
                    host: shard.host,
                    state: shard.state,
                    collections: shardStats.cursor ? shardStats.cursor.firstBatch : []
                });
            } catch (error) {
                logger.error(`❌ خطأ في الحصول على إحصائيات Shard ${shard.name}:`, error);
            }
        }

        return stats;
    } catch (error) {
        logger.error('❌ خطأ في الحصول على إحصائيات Sharding:', error);
        return { enabled: false, error: error.message };
    }
};

/**
 * التحقق من صحة Shards
 */
const checkShardsHealth = async () => {
    if (!shardingConfig.enabled) {
        return { healthy: false, message: 'Sharding غير مفعّل' };
    }

    try {
        const shardsStatus = await checkShardingStatus();
        const unhealthyShards = shardsStatus.shards.filter(shard => shard.state !== '1');
        
        return {
            healthy: unhealthyShards.length === 0,
            totalShards: shardsStatus.shardCount,
            unhealthyShards: unhealthyShards.map(shard => shard.name),
            message: unhealthyShards.length > 0 ? 
                `${unhealthyShards.length} Shards غير صحية` : 
                'جميع Shards صحية'
        };
    } catch (error) {
        logger.error('❌ خطأ في فحص صحة Shards:', error);
        return { healthy: false, error: error.message };
    }
};

module.exports = {
    shardingConfig,
    initSharding,
    enableShardingForCollections,
    getShardForKey,
    checkShardingStatus,
    balanceShards,
    addShard,
    removeShard,
    getShardingStats,
    checkShardsHealth
};
