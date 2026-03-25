/**
 * Security Configuration
 * إعدادات الأمان المتقدمة
 */

// إعدادات Rate Limiting
const RATE_LIMIT_CONFIG = {
    // عام لجميع الطلبات
    general: {
        windowMs: 15 * 60 * 1000, // 15 دقيقة
        max: 1000, // 1000 طلب في 15 دقيقة
        message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً'
    },
    
    // تسجيل الدخول
    login: {
        windowMs: 15 * 60 * 1000, // 15 دقيقة
        max: 5, // 5 محاولات فقط
        message: 'محاولات تسجيل دخول كثيرة جداً، يرجى المحاولة بعد 15 دقيقة'
    },
    
    // API
    api: {
        windowMs: 60 * 60 * 1000, // ساعة
        max: 10000, // 10000 طلب في الساعة
        message: 'طلبات API كثيرة جداً، يرجى المحاولة لاحقاً'
    },
    
    // رفع الملفات
    upload: {
        windowMs: 60 * 60 * 1000, // ساعة
        max: 50, // 50 ملف في الساعة
        message: 'رفع ملفات كثيرة جداً، يرجى المحاولة لاحقاً'
    },
    
    // التعليقات
    comment: {
        windowMs: 60 * 1000, // دقيقة
        max: 10, // 10 تعليقات في الدقيقة
        message: 'تعليقات كثيرة جداً، يرجى الإبطاء'
    },
    
    // البحث
    search: {
        windowMs: 60 * 1000, // دقيقة
        max: 100, // 100 بحث في الدقيقة
        message: 'عمليات بحث كثيرة جداً، يرجى الإبطاء'
    }
};

// إعدادات DDoS Protection
const DDOS_CONFIG = {
    // حماية من الطلبات المتكررة
    rapidRequests: {
        windowMs: 1000, // 1 ثانية
        max: 30, // 30 طلب في الثانية
        message: 'طلبات سريعة جداً، يرجى الإبطاء'
    },
    
    // حماية من الطلبات المتكررة (فترة أطول)
    sustainedRequests: {
        windowMs: 60 * 1000, // دقيقة
        max: 300, // 300 طلب في الدقيقة
        message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً'
    },
    
    // حماية من الطلبات المتكررة (فترة طويلة)
    longTermRequests: {
        windowMs: 10 * 60 * 1000, // 10 دقائق
        max: 1500, // 1500 طلب في 10 دقائق
        message: 'تم حظر الطلبات مؤقتاً'
    },
    
    // حماية من الطلبات المتكررة من نفس IP
    ipBasedRequests: {
        windowMs: 5 * 60 * 1000, // 5 دقائق
        max: 100, // 100 طلب من نفس IP في 5 دقائق
        message: 'طلبات كثيرة من نفس IP، يرجى المحاولة لاحقاً'
    }
};

// إعدادات SSL/HTTPS
const SSL_CONFIG = {
    enabled: process.env.SSL_ENABLED === 'true',
    useProduction: process.env.USE_PRODUCTION_SSL === 'true',
    domain: process.env.SSL_DOMAIN || 'manahlbadr.com',
    email: process.env.SSL_EMAIL || 'admin@manahlbadr.com',
    port: process.env.SSL_PORT || 443,
    httpPort: process.env.HTTP_PORT || 80,
    autoRenew: process.env.SSL_AUTO_RENEW === 'true'
};

// إعدادات Web Application Firewall
const WAF_CONFIG = {
    enabled: process.env.WAF_ENABLED === 'true',
    strictMode: process.env.WAF_STRICT_MODE === 'true',
    logLevel: process.env.WAF_LOG_LEVEL || 'warn',
    
    // أنماط محظورة
    blockedPatterns: [
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
    ]
};

// إعدادات Security Headers
const SECURITY_HEADERS_CONFIG = {
    // Content Security Policy
    contentSecurityPolicy: {
        enabled: true,
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-hashes'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            fontSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com",
                "https://fonts.gstatic.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "blob:"
            ],
            connectSrc: [
                "'self'",
                "https://api.stripe.com",
                "https://checkout.stripe.com"
            ],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: true
        }
    },
    
    // HSTS
    hsts: {
        enabled: true,
        maxAge: 31536000, // سنة
        includeSubDomains: true,
        preload: true
    },
    
    // Headers إضافية
    additionalHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Expect-CT': 'max-age=86400, enforce'
    }
};

// إعدادات CORS
const CORS_CONFIG = {
    enabled: true,
    origins: [
        'http://localhost:3000',
        'https://manahlbadr.com',
        'https://www.manahlbadr.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 ساعة
};

// إعدادات Request Size
const REQUEST_SIZE_CONFIG = {
    maxRequestSize: '10mb',
    maxFileSize: '5mb',
    maxFieldSize: '1mb'
};

// إعدادات Monitoring
const MONITORING_CONFIG = {
    enabled: true,
    logLevel: 'warn',
    suspiciousThreshold: 3,
    cleanupInterval: 5 * 60 * 1000, // 5 دقائق
    blockDuration: 10 * 60 * 1000, // 10 دقائق
    maxSuspiciousCount: 5
};

// IPs محظورة مسبقاً
const BLACKLISTED_IPS = [
    // يمكن إضافة IPs محظورة هنا
    // '192.168.1.100',
    // '10.0.0.50'
];

// إعدادات Session Security
const SESSION_CONFIG = {
    maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    name: 'manahlbadr.sid',
    rolling: true
};

// إعدادات Password Security
const PASSWORD_CONFIG = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 يوم
    historyCount: 5
};

module.exports = {
    RATE_LIMIT_CONFIG,
    DDOS_CONFIG,
    SSL_CONFIG,
    WAF_CONFIG,
    SECURITY_HEADERS_CONFIG,
    CORS_CONFIG,
    REQUEST_SIZE_CONFIG,
    MONITORING_CONFIG,
    BLACKLISTED_IPS,
    SESSION_CONFIG,
    PASSWORD_CONFIG
};
