/**
 * Database Configuration
 * إعدادات اتصال قاعدة البيانات MongoDB
 * — دعم Vercel Serverless: اتصال واحد متزامن (in-flight) + انتظار حتى الجاهزية
 */

const mongoose = require('mongoose');
const config = require('./env');

const isVercel = process.env.VERCEL === '1';

const baseConnectionOptions = {
    maxPoolSize: isVercel ? 5 : 20,
    socketTimeoutMS: 45000,
    family: 4,
    bufferCommands: false,
    retryWrites: true,
    w: 'majority',
    readPreference: 'primary',
    heartbeatFrequencyMS: 10000,
    maxIdleTimeMS: isVercel ? 60000 : 30000,
    waitQueueTimeoutMS: 10000,
    retryReads: true
};

/** مهلة أطول على Atlas عند البارد (Vercel / إنتاج) */
function buildConnectionOptions(dbOptimization) {
    const optimized = { ...baseConnectionOptions, ...dbOptimization.optimizeConnection() };
    delete optimized.bufferMaxEntries;

    const longTimeout = isVercel || config.nodeEnv === 'production';
    const ms = longTimeout ? 12000 : 5000;
    optimized.serverSelectionTimeoutMS = ms;
    optimized.connectTimeoutMS = ms;

    return optimized;
}

mongoose.connection.on('error', (err) => {
    console.error('❌ خطأ في اتصال MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  تم قطع الاتصال من MongoDB');
});

mongoose.connection.on('connected', () => {
    console.log('✅ تم الاتصال بنجاح إلى MongoDB');
    console.log(`📊 قاعدة البيانات: ${mongoose.connection.name}`);
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق اتصال MongoDB بسبب إغلاق التطبيق');
    process.exit(0);
});

/** وعد اتصال واحد — يمنع سباقات متعددة على Vercel */
let connectInflight = null;

async function connectOnceInternal() {
    console.log('🔄 محاولة الاتصال بـ MongoDB...');
    console.log('🔗 Connection String:', config.mongodbUri.replace(/:([^:@]+)@/, ':***@'));

    let dbOptimization;
    try {
        dbOptimization = require('./databaseOptimization');
    } catch (optError) {
        console.warn('⚠️  databaseOptimization غير متاح:', optError.message);
        dbOptimization = {
            optimizeConnection: () => ({}),
            createIndexes: async () => {}
        };
    }

    const optimizedOptions = buildConnectionOptions(dbOptimization);

    console.log('📡 بدء الاتصال بـ MongoDB...');
    await mongoose.connect(config.mongodbUri, optimizedOptions);

    if (mongoose.connection.readyState !== 1) {
        throw new Error('الاتصال فشل - readyState: ' + mongoose.connection.readyState);
    }

    console.log('✅ اتصال MongoDB ناجح');

    if (config.nodeEnv !== 'test') {
        setTimeout(async () => {
            try {
                await dbOptimization.createIndexes();
            } catch (indexError) {
                console.warn('⚠️  تحذير: فشل في إنشاء Indexes:', indexError.message);
            }
        }, 2000);
    }

    return mongoose.connection;
}

/**
 * الاتصال بقاعدة البيانات (آمن للاستدعاء المتزامن — نفس الوعد للجميع)
 */
const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!connectInflight) {
        connectInflight = connectOnceInternal().finally(() => {
            connectInflight = null;
        });
    }

    try {
        return await connectInflight;
    } catch (error) {
        console.error('❌ خطأ في الاتصال بـ MongoDB:', error.message);

        if (config.nodeEnv === 'development') {
            console.warn('⚠️  الخادم سيعمل بدون قاعدة بيانات (للتطوير فقط)');
            console.warn('💡 تأكد من MongoDB محلياً أو Atlas');
            return null;
        }

        throw error;
    }
};

/**
 * انتظار جاهزية قاعدة البيانات قبل معالجة طلبات /api/
 * يحلّ سباق البارد على Vercel حيث كان readyState !== 1 يعيد 503 فوراً
 */
async function ensureDbReady() {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        const err = new Error('قاعدة البيانات غير متصلة');
        err.code = 'DB_NOT_READY';
        throw err;
    }
}

module.exports = { connectDB, ensureDbReady, mongoose };
