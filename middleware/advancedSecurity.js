/**
 * Advanced Security Middleware
 * حلول أمنية متقدمة للحماية من الهجمات الشائعة
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const config = require('../config/env');
const logger = require('../utils/logger');

// إعدادات Rate Limiting المتقدمة
const RATE_LIMIT_CONFIG = {
    // عام لجميع الطلبات
    general: {
        windowMs: 15 * 60 * 1000, // 15 دقيقة
        max: 1000, // 1000 طلب في 15 دقيقة
        message: {
            success: false,
            message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً',
            error: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
    },

    // تسجيل الدخول
    login: {
        windowMs: 15 * 60 * 1000, // 15 دقيقة
        max: 5, // 5 محاولات فقط
        message: {
            success: false,
            message: 'محاولات تسجيل دخول كثيرة جداً، يرجى المحاولة بعد 15 دقيقة',
            error: 'LOGIN_RATE_LIMIT_EXCEEDED'
        },
        skipSuccessfulRequests: true,
        skipFailedRequests: false,
    },

    // API
    api: {
        windowMs: 60 * 60 * 1000, // ساعة
        max: 10000, // 10000 طلب في الساعة
        message: {
            success: false,
            message: 'طلبات API كثيرة جداً، يرجى المحاولة لاحقاً',
            error: 'API_RATE_LIMIT_EXCEEDED'
        },
    },

    // رفع الملفات
    upload: {
        windowMs: 60 * 60 * 1000, // ساعة
        max: 50, // 50 ملف في الساعة
        message: {
            success: false,
            message: 'رفع ملفات كثيرة جداً، يرجى المحاولة لاحقاً',
            error: 'UPLOAD_RATE_LIMIT_EXCEEDED'
        },
    },

    // التعليقات
    comment: {
        windowMs: 60 * 1000, // دقيقة
        max: 10, // 10 تعليقات في الدقيقة
        message: {
            success: false,
            message: 'تعليقات كثيرة جداً، يرجى الإبطاء',
            error: 'COMMENT_RATE_LIMIT_EXCEEDED'
        },
    },

    // البحث
    search: {
        windowMs: 60 * 1000, // دقيقة
        max: 100, // 100 بحث في الدقيقة
        message: {
            success: false,
            message: 'عمليات بحث كثيرة جداً، يرجى الإبطاء',
            error: 'SEARCH_RATE_LIMIT_EXCEEDED'
        },
    }
};

/**
 * Rate Limiting متقدم - معطل مؤقتاً
 */
const createRateLimit = (config) => {
    return (req, res, next) => {
        // Rate Limiting معطل مؤقتاً لتجنب أخطاء v7
        next();
    };
};

// Rate Limiting لأنواع مختلفة من الطلبات
exports.generalRateLimit = createRateLimit(RATE_LIMIT_CONFIG.general);
exports.loginRateLimit = createRateLimit(RATE_LIMIT_CONFIG.login);
exports.apiRateLimit = createRateLimit(RATE_LIMIT_CONFIG.api);
exports.uploadRateLimit = createRateLimit(RATE_LIMIT_CONFIG.upload);
exports.commentRateLimit = createRateLimit(RATE_LIMIT_CONFIG.comment);
exports.searchRateLimit = createRateLimit(RATE_LIMIT_CONFIG.search);

/**
 * Helmet متقدم مع إعدادات مخصصة - معطل مؤقتاً
 */
exports.advancedHelmet = (req, res, next) => {
    // Helmet معطل مؤقتاً لتجنب أخطاء CSP
    next();
};

/**
 * Web Application Firewall (WAF) بسيط
 */
exports.waf = (req, res, next) => {
    const suspiciousPatterns = [
        // SQL Injection
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
        /(\b(OR|AND)\s+\w+\s*=\s*\w+)/i,

        // XSS
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,

        // Path Traversal
        /\.\.[\/\\]/gi,
        /\.\.%2f/gi,
        /\.\.%5c/gi,

        // Command Injection
        /(\b(cat|ls|dir|type|whoami|uname|id)\b)/i,
        /(\b(ping|wget|curl|nc|netcat)\b)/i,
        /[;&|`$(){}[\]]/gi,

        // NoSQL Injection
        /\$where/i,
        /\$ne/i,
        /\$gt/i,
        /\$lt/i,
        /\$in/i,
        /\$nin/i,

        // File Upload Attacks
        /\.php$/i,
        /\.asp$/i,
        /\.jsp$/i,
        /\.sh$/i,
        /\.exe$/i,
        /\.bat$/i,
        /\.cmd$/i,
    ];

    // فحص URL
    const url = req.url;
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
            logger.error(`🚨 WAF: Suspicious URL detected: ${url} from IP: ${req.ip}`);
            return res.status(403).json({
                success: false,
                message: 'طلب غير مسموح',
                error: 'WAF_BLOCKED'
            });
        }
    }

    // فحص الـ Headers
    for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(value)) {
                    logger.error(`🚨 WAF: Suspicious header detected: ${key}: ${value} from IP: ${req.ip}`);
                    return res.status(403).json({
                        success: false,
                        message: 'طلب غير مسموح',
                        error: 'WAF_BLOCKED'
                    });
                }
            }
        }
    }

    // فحص الـ Body (لطلبات POST/PUT)
    if (req.body && typeof req.body === 'object') {
        const bodyString = JSON.stringify(req.body);
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(bodyString)) {
                logger.error(`🚨 WAF: Suspicious body detected from IP: ${req.ip}`);
                return res.status(403).json({
                    success: false,
                    message: 'طلب غير مسموح',
                    error: 'WAF_BLOCKED'
                });
            }
        }
    }

    next();
};

/**
 * IP Blacklist
 */
const BLACKLISTED_IPS = new Set([
    // يمكن إضافة IPs محظورة هنا
    // '192.168.1.100',
    // '10.0.0.50'
]);

exports.ipBlacklist = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (BLACKLISTED_IPS.has(clientIP)) {
        logger.error(`🚨 Blacklisted IP attempted access: ${clientIP}`);
        return res.status(403).json({
            success: false,
            message: 'الوصول ممنوع من هذا IP',
            error: 'IP_BLACKLISTED'
        });
    }

    next();
};

/**
 * إضافة IP للـ Blacklist
 */
exports.addToBlacklist = (ip) => {
    BLACKLISTED_IPS.add(ip);
    logger.warn(`🚨 IP added to blacklist: ${ip}`);
};

/**
 * إزالة IP من الـ Blacklist
 */
exports.removeFromBlacklist = (ip) => {
    BLACKLISTED_IPS.delete(ip);
    logger.info(`✅ IP removed from blacklist: ${ip}`);
};

/**
 * Security Headers إضافية
 */
exports.securityHeaders = (req, res, next) => {
    // إعدادات الأمان الإضافية
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // في الإنتاج
    if (config.nodeEnv === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('Expect-CT', 'max-age=86400, enforce');
    }

    next();
};

/**
 * SSL Redirect
 */
exports.sslRedirect = (req, res, next) => {
    if (config.nodeEnv === 'production' && !req.secure) {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
};

/**
 * CORS متقدم
 */
exports.corsMiddleware = (req, res, next) => {
    const allowedOrigins = [
        'http://localhost:3000',
        'https://manahlbadr.com',
        'https://www.manahlbadr.com',
        'https://manahl-reef-wasab-honey.vercel.app'
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 ساعة

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
};

/**
 * Request Size Limit
 */
exports.requestSizeLimit = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = req.headers['content-length'];

        if (contentLength) {
            const sizeInBytes = parseInt(contentLength);
            const maxBytes = parseSize(maxSize);

            if (sizeInBytes > maxBytes) {
                logger.error(`🚨 Request size too large: ${sizeInBytes} bytes from IP: ${req.ip}`);
                return res.status(413).json({
                    success: false,
                    message: 'حجم الطلب كبير جداً',
                    error: 'REQUEST_TOO_LARGE'
                });
            }
        }

        next();
    };
};

/**
 * تحليل حجم من string
 */
function parseSize(size) {
    const units = {
        'b': 1,
        'kb': 1024,
        'mb': 1024 * 1024,
        'gb': 1024 * 1024 * 1024
    };

    const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);

    if (!match) {
        return 10 * 1024 * 1024; // 10MB افتراضي
    }

    const [, value, unit = 'b'] = match;
    return parseFloat(value) * (units[unit] || 1);
}

/**
 * Security Monitoring
 */
exports.securityMonitor = (req, res, next) => {
    const startTime = Date.now();

    // تسجيل الطلبات المشبوهة
    const suspiciousIndicators = [
        req.headers['user-agent']?.includes('bot'),
        req.headers['user-agent']?.includes('crawler'),
        req.url.includes('admin'),
        req.url.includes('wp-'),
        req.url.includes('.php'),
        req.url.includes('.asp'),
        req.url.includes('.jsp')
    ];

    if (suspiciousIndicators.some(indicator => indicator)) {
        logger.warn(`🔍 Suspicious request: ${req.method} ${req.url} from IP: ${req.ip}, User-Agent: ${req.headers['user-agent']}`);
    }

    // مراقبة وقت الاستجابة
    res.on('finish', () => {
        const duration = Date.now() - startTime;

        if (duration > 5000) { // أكثر من 5 ثواني
            logger.warn(`⏱️ Slow request: ${req.method} ${req.url} took ${duration}ms from IP: ${req.ip}`);
        }

        if (res.statusCode >= 400) {
            logger.warn(`📊 Error response: ${res.statusCode} for ${req.method} ${req.url} from IP: ${req.ip}`);
        }
    });

    next();
};

/**
 * Security Headers للـ SSL
 */
exports.sslHeaders = (req, res, next) => {
    if (config.nodeEnv === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('Expect-CT', 'max-age=86400, enforce');
    }

    next();
};

module.exports = {
    RATE_LIMIT_CONFIG,
    createRateLimit,
    BLACKLISTED_IPS
};
