/**
 * Security Middleware
 * Middleware للأمان والحماية
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const config = require('../config/env');

/**
 * Helmet - حماية Headers (لا يكشف معلومات الخادم للمستخدم)
 */
exports.helmet = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com"
            ],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-hashes'",
                "https://cdn.jsdelivr.net"
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            fontSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com",
                "https://fonts.gstatic.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: config.nodeEnv === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    } : false,
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * Rate Limiting - تحديد معدل الطلبات
 */
// Rate limiter عام (للطلبات العامة فقط؛ مسارات الأدمن لها حد منفصل)
exports.generalLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs, // 15 minutes
    max: config.rateLimitMaxRequests, // حد أعلى لاستيعاب عدد المستخدمين
    message: {
        success: false,
        message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (req.path === '/health') return true;
        // عدم احتساب طلبات لوحة التحكم في الحد العام (لها adminLimiter منفصل)
        if (typeof req.path === 'string' && req.path.startsWith('/api/admin')) return true;
        return false;
    }
});

// Rate limiter للمصادقة (أكثر صرامة)
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 محاولات فقط
    message: {
        success: false,
        message: 'تم تجاوز عدد محاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة'
    },
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    // معالجة عند تجاوز الحد
    handler: (req, res) => {
        const logger = require('../utils/logger');
        logger.warn('Rate limit exceeded for auth', {
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString()
        });
        res.status(429).json({
            success: false,
            message: 'تم تجاوز عدد محاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة'
        });
    }
});

// Rate limiter لإنشاء الحسابات (مرن لاستيعاب عدد كبير من المستخدمين الجدد)
exports.registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // 15 تسجيل في الساعة لكل IP (كافٍ للمتاجر الحقيقية)
    message: {
        success: false,
        message: 'تم تجاوز الحد الأقصى لإنشاء الحسابات. يرجى المحاولة لاحقاً'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const logger = require('../utils/logger');
        logger.warn('Rate limit exceeded for registration', {
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString()
        });
        res.status(429).json({
            success: false,
            message: 'تم تجاوز الحد الأقصى لإنشاء الحسابات. يرجى المحاولة لاحقاً'
        });
    }
});

// Rate limiter للـ API العامة (أكثر مرونة)
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 طلب في 15 دقيقة
    message: {
        success: false,
        message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter لوحة التحكم (الإدارة) — حد كافٍ لتحميل كل التبويبات والتحديث التلقائي
exports.adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: {
        success: false,
        message: 'تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/login'
});

/**
 * منع تسريب بيانات حساسة في أي استجابة JSON
 * حتى لو فتح أحد أدوات المطور (DevTools) لا يظهر كلمة المرور أو ما شابهها
 */
const SENSITIVE_KEYS = [
    'password', 'passwordHash', 'hash', 'salt',
    'passwordResetToken', 'passwordResetExpires',
    'emailVerificationToken', 'emailVerificationExpires',
    '__v', 'secret', 'apiKey', 'adminPassword'
];
function stripSensitive(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(stripSensitive);
    const out = {};
    for (const key of Object.keys(obj)) {
        if (SENSITIVE_KEYS.includes(key)) continue;
        out[key] = stripSensitive(obj[key]);
    }
    return out;
}
exports.sanitizeResponse = (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        if (body && typeof body === 'object') {
            body = stripSensitive(body);
        }
        return originalJson(body);
    };
    next();
};

/**
 * MongoDB Sanitization - تنظيف البيانات من NoSQL Injection
 */
exports.mongoSanitize = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        const logger = require('../utils/logger');
        logger.warn('MongoDB injection attempt detected', {
            ip: req.ip,
            key: key,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * XSS Protection - حماية من XSS attacks
 */
exports.xssClean = xss();

/**
 * CORS Configuration
 * في الإنتاج: فقط FRONTEND_URL مسموح. في التطوير: localhost مسموح.
 */
exports.corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        const allowedOrigins = [
            config.frontendUrl,
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001'
        ].filter(Boolean);
        if (config.nodeEnv === 'production') {
            if (allowedOrigins.indexOf(origin) !== -1) {
                return callback(null, true);
            }
            return callback(new Error('غير مسموح بهذا الأصل من CORS'));
        }
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        callback(new Error('غير مسموح بهذا الأصل من CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
