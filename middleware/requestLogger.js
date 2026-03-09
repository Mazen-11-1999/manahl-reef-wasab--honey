/**
 * Request Logger Middleware
 * Middleware لتسجيل جميع الطلبات الواردة
 */

const logger = require('../utils/logger');

/**
 * تسجيل الطلبات الواردة
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // تسجيل الطلب الوارد
    logger.info('Incoming Request', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    });

    // تسجيل الاستجابة عند الانتهاء
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            userId: req.user ? req.user._id : null
        };

        if (res.statusCode >= 400) {
            logger.warn('Request Error', logData);
        } else {
            logger.info('Request Completed', logData);
        }
    });

    next();
};

module.exports = requestLogger;




















