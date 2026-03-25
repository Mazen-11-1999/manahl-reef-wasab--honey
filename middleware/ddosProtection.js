/**
 * DDoS Protection Middleware
 * حماية متقدمة من هجمات DDoS
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const config = require('../config/env');

// إعدادات الحماية من DDoS
const DDOS_CONFIG = {
    // حماية من الطلبات المتكررة
    rapidRequests: {
        windowMs: 1000, // 1 ثانية
        max: 30, // 30 طلب في الثانية
        message: {
            success: false,
            message: 'طلبات سريعة جداً، يرجى الإبطاء',
            error: 'RAPID_REQUESTS_BLOCKED'
        }
    },
    
    // حماية من الطلبات المتكررة (فترة أطول)
    sustainedRequests: {
        windowMs: 60 * 1000, // دقيقة
        max: 300, // 300 طلب في الدقيقة
        message: {
            success: false,
            message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً',
            error: 'SUSTAINED_REQUESTS_BLOCKED'
        }
    },
    
    // حماية من الطلبات المتكررة (فترة طويلة)
    longTermRequests: {
        windowMs: 10 * 60 * 1000, // 10 دقائق
        max: 1500, // 1500 طلب في 10 دقائق
        message: {
            success: false,
            message: 'تم حظر الطلبات مؤقتاً',
            error: 'LONG_TERM_REQUESTS_BLOCKED'
        }
    },
    
    // حماية من الطلبات المتكررة من نفس IP
    ipBasedRequests: {
        windowMs: 5 * 60 * 1000, // 5 دقائق
        max: 100, // 100 طلب من نفس IP في 5 دقائق
        message: {
            success: false,
            message: 'طلبات كثيرة من نفس IP، يرجى المحاولة لاحقاً',
            error: 'IP_RATE_LIMIT_EXCEEDED'
        }
    }
};

// تخزين مؤقت لتتبع الطلبات المشبوهة
const suspiciousIPs = new Map();
const blockedIPs = new Map();

/**
 * Rate Limiting للطلبات السريعة
 */
exports.rapidRequestsLimit = rateLimit({
    windowMs: DDOS_CONFIG.rapidRequests.windowMs,
    max: DDOS_CONFIG.rapidRequests.max,
    message: DDOS_CONFIG.rapidRequests.message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        logger.error(`🚨 Rapid requests detected from IP: ${ip}`);
        markSuspiciousIP(ip, 'rapid_requests');
        res.status(429).json(DDOS_CONFIG.rapidRequests.message);
    }
});

/**
 * Rate Limiting للطلبات المستمرة
 */
exports.sustainedRequestsLimit = rateLimit({
    windowMs: DDOS_CONFIG.sustainedRequests.windowMs,
    max: DDOS_CONFIG.sustainedRequests.max,
    message: DDOS_CONFIG.sustainedRequests.message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        logger.error(`🚨 Sustained requests detected from IP: ${ip}`);
        markSuspiciousIP(ip, 'sustained_requests');
        res.status(429).json(DDOS_CONFIG.sustainedRequests.message);
    }
});

/**
 * Rate Limiting للطلبات طويلة الأمد
 */
exports.longTermRequestsLimit = rateLimit({
    windowMs: DDOS_CONFIG.longTermRequests.windowMs,
    max: DDOS_CONFIG.longTermRequests.max,
    message: DDOS_CONFIG.longTermRequests.message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        logger.error(`🚨 Long-term requests detected from IP: ${ip}`);
        markSuspiciousIP(ip, 'long_term_requests');
        res.status(429).json(DDOS_CONFIG.longTermRequests.message);
    }
});

/**
 * Rate Limiting للطلبات من نفس IP
 */
exports.ipBasedRequestsLimit = rateLimit({
    windowMs: DDOS_CONFIG.ipBasedRequests.windowMs,
    max: DDOS_CONFIG.ipBasedRequests.max,
    message: DDOS_CONFIG.ipBasedRequests.message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
    handler: (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        logger.error(`🚨 IP-based requests detected from IP: ${ip}`);
        markSuspiciousIP(ip, 'ip_based_requests');
        res.status(429).json(DDOS_CONFIG.ipBasedRequests.message);
    }
});

/**
 * تحديد IP مشبوه
 */
function markSuspiciousIP(ip, reason) {
    const now = Date.now();
    const current = suspiciousIPs.get(ip) || { count: 0, reasons: [], firstSeen: now };
    
    current.count++;
    current.reasons.push(reason);
    current.lastSeen = now;
    
    suspiciousIPs.set(ip, current);
    
    // إذا كان IP مشبوهاً جداً، حظره مؤقتاً
    if (current.count >= 5) {
        blockIP(ip, 10 * 60 * 1000); // حظر لمدة 10 دقائق
    }
}

/**
 * حظر IP مؤقتاً
 */
function blockIP(ip, duration) {
    const now = Date.now();
    blockedIPs.set(ip, {
        blockedAt: now,
        duration: duration,
        reason: 'DDoS Protection'
    });
    
    logger.warn(`🚨 IP blocked temporarily: ${ip} for ${duration / 1000} seconds`);
    
    // إلغاء الحظر تلقائياً
    setTimeout(() => {
        blockedIPs.delete(ip);
        logger.info(`✅ IP unblocked: ${ip}`);
    }, duration);
}

/**
 * التحقق من IPs المحظورة
 */
exports.checkBlockedIPs = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    if (blockedIPs.has(ip)) {
        const blockInfo = blockedIPs.get(ip);
        const remainingTime = Math.ceil((blockInfo.blockedAt + blockInfo.duration - Date.now()) / 1000);
        
        logger.error(`🚨 Blocked IP attempted access: ${ip}, remaining: ${remainingTime}s`);
        
        return res.status(403).json({
            success: false,
            message: 'تم حظر IP مؤقتاً',
            error: 'IP_BLOCKED',
            remainingTime: remainingTime
        });
    }
    
    next();
};

/**
 * مراقبة الطلبات المشبوهة
 */
exports.ddosMonitor = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    // مؤشرات الـ DDoS
    const ddosIndicators = [
        // User Agent مشبوه
        /bot/i.test(userAgent),
        /crawler/i.test(userAgent),
        /scraper/i.test(userAgent),
        /curl/i.test(userAgent),
        /wget/i.test(userAgent),
        
        // Headers مشبوهة
        !req.headers['user-agent'],
        req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',').length > 3,
        
        // URL مشبوه
        req.url.includes('admin'),
        req.url.includes('wp-'),
        req.url.includes('.php'),
        req.url.includes('.asp'),
        req.url.includes('.jsp'),
        req.url.includes('..'),
        
        // حجم الطلب كبير
        req.headers['content-length'] && parseInt(req.headers['content-length']) > 10 * 1024 * 1024, // 10MB
    ];
    
    const suspiciousScore = ddosIndicators.filter(Boolean).length;
    
    if (suspiciousScore >= 3) {
        logger.warn(`🔍 High DDoS risk: ${suspiciousScore}/7 indicators from IP: ${ip}, User-Agent: ${userAgent}`);
        markSuspiciousIP(ip, 'high_risk');
    }
    
    // مراقبة عدد الطلبات من نفس IP
    const current = suspiciousIPs.get(ip);
    if (current && current.count > 10) {
        logger.warn(`📊 High request count: ${current.count} requests from IP: ${ip}`);
    }
    
    next();
};

/**
 * تحليل الـ User Agent
 */
exports.userAgentAnalysis = (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;
    
    // User Agents مشبوهة
    const suspiciousUserAgents = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /java/i,
        /go-http/i,
        /node/i,
        /ruby/i,
        /php/i,
        /perl/i,
        /csharp/i,
        /powershell/i,
        /bash/i,
        /sh/i
    ];
    
    const isSuspicious = suspiciousUserAgents.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
        logger.warn(`🤖 Suspicious User-Agent detected: ${userAgent} from IP: ${ip}`);
        markSuspiciousIP(ip, 'suspicious_user_agent');
    }
    
    // User Agent فارغ أو غير موجود
    if (!userAgent || userAgent.length < 10) {
        logger.warn(`❌ Empty or invalid User-Agent from IP: ${ip}`);
        markSuspiciousIP(ip, 'empty_user_agent');
    }
    
    next();
};

/**
 * مراقبة حجم البيانات
 */
exports.dataSizeMonitor = (req, res, next) => {
    const contentLength = req.headers['content-length'];
    const ip = req.ip || req.connection.remoteAddress;
    
    if (contentLength) {
        const size = parseInt(contentLength);
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (size > maxSize) {
            logger.warn(`📦 Large request detected: ${size} bytes from IP: ${ip}`);
            markSuspiciousIP(ip, 'large_request');
            
            return res.status(413).json({
                success: false,
                message: 'حجم الطلب كبير جداً',
                error: 'REQUEST_TOO_LARGE'
            });
        }
    }
    
    next();
};

/**
 * مراقبة الوقت المستغرق
 */
exports.responseTimeMonitor = (req, res, next) => {
    const startTime = Date.now();
    const ip = req.ip || req.connection.remoteAddress;
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // إذا كان الطلب يستغرق وقتاً طويلاً جداً
        if (duration > 30000) { // 30 ثانية
            logger.warn(`⏱️ Very slow request: ${req.method} ${req.url} took ${duration}ms from IP: ${ip}`);
            markSuspiciousIP(ip, 'slow_request');
        }
    });
    
    next();
};

/**
 * تنظيف الـ IPs المشبوهة القديمة
 */
setInterval(() => {
    const now = Date.now();
    const cleanupThreshold = 60 * 60 * 1000; // ساعة
    
    for (const [ip, data] of suspiciousIPs.entries()) {
        if (now - data.lastSeen > cleanupThreshold) {
            suspiciousIPs.delete(ip);
            logger.info(`🧹 Cleaned up old suspicious IP: ${ip}`);
        }
    }
}, 5 * 60 * 1000); // كل 5 دقائق

/**
 * الحصول على إحصائيات DDoS
 */
exports.getDDoSStats = () => {
    return {
        suspiciousIPs: suspiciousIPs.size,
        blockedIPs: blockedIPs.size,
        totalRequests: Array.from(suspiciousIPs.values()).reduce((sum, ip) => sum + ip.count, 0),
        mostSuspicious: Array.from(suspiciousIPs.entries())
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 10)
            .map(([ip, data]) => ({ ip, count: data.count, reasons: data.reasons }))
    };
};

/**
 * إلغاء حظر IP
 */
exports.unblockIP = (ip) => {
    blockedIPs.delete(ip);
    logger.info(`✅ Manually unblocked IP: ${ip}`);
};

/**
 * حظر IP يدوياً
 */
exports.blockIPManually = (ip, duration = 60 * 60 * 1000) => {
    blockIP(ip, duration);
    logger.warn(`🚨 Manually blocked IP: ${ip} for ${duration / 1000} seconds`);
};

module.exports = {
    DDOS_CONFIG,
    suspiciousIPs,
    blockedIPs
};
