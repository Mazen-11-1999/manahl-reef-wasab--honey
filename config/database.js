/**
 * Database Configuration
 * إعدادات اتصال قاعدة البيانات MongoDB
 */

const mongoose = require('mongoose');
const config = require('./env');

// تحسينات الاتصال (تدعم عدداً كبيراً من المستخدمين)
const connectionOptions = {
    maxPoolSize: 1, // تقليل حجم التجمع للبيئة Serverless
    serverSelectionTimeoutMS: 10000, // تقليل إلى 10 ثواني للسرعة
    socketTimeoutMS: 30000, // 30 ثانية قبل إغلاق المقبس الخامل
    family: 4,
    bufferCommands: false,
    retryWrites: true,
    w: 'majority',
    readPreference: 'primary',
    connectTimeoutMS: 10000, // 10 ثواني للاتصال الأولي
    heartbeatFrequencyMS: 5000, // 5 ثواني لل heartbeat
    maxIdleTimeMS: 10000, // 10 ثواني كحد أقصى للاتصال الخامل
    waitQueueTimeoutMS: 5000, // 5 ثواني للانتظار في الطابور
    retryReads: true
};

// معالجة الأخطاء
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

// معالجة إغلاق التطبيق
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 تم إغلاق اتصال MongoDB بسبب إغلاق التطبيق');
    process.exit(0);
});

/**
 * الاتصال بقاعدة البيانات
 */
const connectDB = async () => {
    try {
        console.log('🔄 محاولة الاتصال بـ MongoDB...');
        console.log('⏱️  مهلة الاتصال: 30 ثانية...');
        console.log('🔗 Connection String:', config.mongodbUri.replace(/:([^:@]+)@/, ':***@')); // إخفاء كلمة المرور

        // محاولة تحميل databaseOptimization بشكل آمن
        let dbOptimization;
        try {
            dbOptimization = require('./databaseOptimization');
        } catch (optError) {
            console.warn('⚠️  databaseOptimization غير متاح:', optError.message);
            dbOptimization = {
                optimizeConnection: () => ({}),
                createIndexes: async () => { }
            };
        }

        const optimizedOptions = { ...connectionOptions, ...dbOptimization.optimizeConnection() };

        // إزالة bufferMaxEntries إذا كان موجوداً (غير مدعوم في MongoDB الحديث)
        delete optimizedOptions.bufferMaxEntries;

        // ضبط timeout حسب البيئة (تطوير / إنتاج)
        if (config.nodeEnv === 'development') {
            optimizedOptions.serverSelectionTimeoutMS = 20000;
            optimizedOptions.connectTimeoutMS = 20000;
        } else {
            optimizedOptions.serverSelectionTimeoutMS = 15000; // إنتاج: 15 ثانية
            optimizedOptions.connectTimeoutMS = 15000;
        }

        console.log('📡 بدء الاتصال بـ MongoDB...');

        // في بيئة التطوير، استخدم الاتصال العادي بدون Promise.race إضافي
        if (config.nodeEnv === 'development') {
            await mongoose.connect(config.mongodbUri, optimizedOptions);
            // انتظار قصير للتحقق من حالة الاتصال
            await new Promise(resolve => setTimeout(resolve, 100));

            // التحقق من حالة الاتصال قبل طباعة الرسالة
            if (mongoose.connection.readyState === 1) {
                console.log('✅ اتصال MongoDB ناجح');
            } else {
                throw new Error('الاتصال فشل - readyState: ' + mongoose.connection.readyState);
            }
        } else {
            // في الإنتاج، استخدم الاتصال العادي مع timeout أطول
            optimizedOptions.serverSelectionTimeoutMS = 30000; // 30 ثانية
            optimizedOptions.connectTimeoutMS = 30000; // 30 ثانية
            await mongoose.connect(config.mongodbUri, optimizedOptions);
            console.log('✅ تم الاتصال بـ MongoDB بنجاح!');
            console.log('🔗 Connection String:', config.mongodbUri.replace(/:([^:@]+)@/, ':***@')); // إخفاء كلمة المرور
            if (mongoose.connection.readyState === 1) {
                console.log('✅ اتصال MongoDB ناجح');
            } else {
                throw new Error('الاتصال فشل - readyState: ' + mongoose.connection.readyState);
            }
        }

        // إنشاء Indexes بعد الاتصال (فقط إذا كان الاتصال ناجح)
        if (mongoose.connection.readyState === 1 && config.nodeEnv !== 'test') {
            setTimeout(async () => {
                try {
                    await dbOptimization.createIndexes();
                } catch (indexError) {
                    console.warn('⚠️  تحذير: فشل في إنشاء Indexes:', indexError.message);
                }
            }, 2000); // انتظار 2 ثانية لضمان اكتمال الاتصال
        }

        // إرجاع الاتصال فقط إذا كان متصلاً
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        } else {
            throw new Error('الاتصال فشل - readyState: ' + mongoose.connection.readyState);
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال بـ MongoDB:', error.message);

        // في الإنتاج، لا ننهي العملية بل نحاول مرة أخرى
        if (config.nodeEnv === 'production') {
            console.warn('⚠️  فشل الاتصال بقاعدة البيانات في الإنتاج - سيتم استخدام البيانات الوهمية');
            console.log('🔄 سيتم إعادة محاولة الاتصال في الخلفية...');

            // محاولة إعادة الاتصال بعد 10 ثواني
            setTimeout(() => {
                console.log('🔄 إعادة محاولة الاتصال بقاعدة البيانات...');
                connectDB().catch(err => {
                    console.warn('⚠️  فشلت إعادة محاولة الاتصال:', err.message);
                });
            }, 10000);

            return; // لا نرمي الخطأ في الإنتاج
        }

        // في بيئة التطوير، لا نوقف الخادم إذا فشل الاتصال
        if (config.nodeEnv === 'development') {
            console.warn('⚠️  فشل الاتصال بقاعدة البيانات:', error.message);
            console.warn('⚠️  الخادم سيعمل بدون قاعدة بيانات (للتطوير فقط)');
            console.warn('⚠️  بعض الميزات قد لا تعمل بشكل صحيح');
            console.warn('💡 تأكد من تشغيل MongoDB على: mongodb://localhost:27017/manahl-badr');
            console.warn('💡 أو استخدم MongoDB Atlas أو Docker');
            // في بيئة التطوير، نعيد null بدلاً من رمي الخطأ
            return null;
        }

        throw error; // في بيئات أخرى، نرمي الخطأ
        // في الإنتاج (Vercel)، لا نوقف الخادم أبداً
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
        console.error('⚠️  الخادم سيستمر بدون قاعدة بيانات في Vercel');
        console.error('💡 بعض الميزات قد لا تعمل بشكل صحيح');
        console.error('🔄 استمرار عمل الخادم...');
        // في Vercel، نعيد null ونستمر
        return null;
    }
};

module.exports = { connectDB, mongoose };
