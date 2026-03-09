/**
 * Cache Middleware
 * Middleware للتخزين المؤقت للاستجابات
 */

const cache = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * Cache middleware للاستجابات
 * @param {number} duration - مدة التخزين المؤقت بالثواني
 * @param {string} keyPrefix - بادئة المفتاح (اختياري)
 */
const cacheResponse = (duration = 300, keyPrefix = '') => {
    return async (req, res, next) => {
        // تخطي Cache للـ POST, PUT, DELETE, PATCH
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            return next();
        }

        // تخطي Cache إذا كان المستخدم مسجل دخول (للبيانات الشخصية)
        if (req.user && req.path.includes('/profile')) {
            return next();
        }

        // إنشاء مفتاح Cache
        const key = `${keyPrefix}${req.originalUrl || req.url}`;

        try {
            // محاولة الحصول من Cache (مع معالجة الأخطاء)
            try {
                const cached = await cache.get(key);
                if (cached) {
                    logger.debug(`Cache hit: ${key}`);
                    return res.status(200).json(cached);
                }
            } catch (cacheError) {
                // إذا فشل Cache (مثل Redis غير متاح)، نتابع بدون Cache
                logger.debug(`Cache unavailable, continuing without cache: ${key}`);
            }

            // حفظ الاستجابة الأصلية
            const originalJson = res.json.bind(res);

            // استبدال res.json لحفظ الاستجابة في Cache
            res.json = function(data) {
                // حفظ في Cache فقط للاستجابات الناجحة
                if (res.statusCode === 200 && data.success !== false) {
                    cache.set(key, data, duration).catch(err => {
                        // لا نوقف العملية إذا فشل Cache
                        logger.debug('Cache set error (non-critical):', err.message);
                    });
                }
                return originalJson(data);
            };

            next();
        } catch (error) {
            logger.error('Cache middleware error:', error);
            // في حالة الخطأ، نتابع بدون Cache
            next();
        }
    };
};

/**
 * Cache middleware مخصص
 * @param {Function} keyGenerator - دالة لإنشاء مفتاح Cache
 * @param {number} duration - مدة التخزين المؤقت بالثواني
 */
const customCache = (keyGenerator, duration = 300) => {
    return async (req, res, next) => {
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            return next();
        }

        const key = keyGenerator(req);

        try {
            const cached = await cache.get(key);

            if (cached) {
                logger.debug(`Cache hit: ${key}`);
                return res.status(200).json(cached);
            }

            const originalJson = res.json.bind(res);

            res.json = function(data) {
                if (res.statusCode === 200 && data.success !== false) {
                    cache.set(key, data, duration).catch(err => {
                        logger.error('Cache set error:', err);
                    });
                }
                return originalJson(data);
            };

            next();
        } catch (error) {
            logger.error('Custom cache middleware error:', error);
            next();
        }
    };
};

/**
 * حذف Cache عند التحديث
 * @param {string} pattern - نمط المفاتيح المراد حذفها
 */
const invalidateCache = (pattern) => {
    return async (req, res, next) => {
        // تنفيذ العملية أولاً
        await next();

        // حذف Cache بعد التحديث
        if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
                await cache.delPattern(pattern);
                logger.debug(`Cache invalidated: ${pattern}`);
            } catch (error) {
                logger.error('Cache invalidation error:', error);
            }
        }
    };
};

module.exports = {
    cacheResponse,
    customCache,
    invalidateCache
};










