/**
 * Environment Variables Configuration
 * التحقق من وجود جميع متغيرات البيئة المطلوبة
 */

require('dotenv').config();

const nodeEnvForLimits = process.env.NODE_ENV || 'development';

/**
 * حد الطلبات العامة لـ /api/* — قيماً منخفضة جداً (مثل 100/15د) تُسبب 429 لمتصفحي المتجر والإدارة.
 */
function computeRateLimitMax() {
    const raw = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10);
    let max = Number.isFinite(raw) && raw > 0 ? raw : 1000;
    const floor = nodeEnvForLimits === 'production' ? 500 : 250;
    if (max < floor) {
        console.warn(
            `⚠️ RATE_LIMIT_MAX_REQUESTS=${max} ضيّق جداً لمستخدمي المتجر؛ يُضبط على ${floor} (غيّر المتغير لو احتجت قيماً أعلى)`
        );
        max = floor;
    }
    return max;
}

const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
];

// التحقق من وجود المتغيرات المطلوبة
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('❌ متغيرات البيئة المطلوبة مفقودة:', missingVars.join(', '));
    console.error('يرجى إنشاء ملف .env وإضافة المتغيرات المطلوبة');
    process.exit(1);
}

// إعدادات افتراضية للتطوير
const config = {
    // Server
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    /** نطاقات إضافية لـ CORS في الإنتاج (مفصولة بفواصل)، مثل نسخة Vercel أو www */
    corsExtraOrigins: (process.env.CORS_EXTRA_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),

    /**
     * CORS_ORIGIN: *, أو all = السماح لجميع الأصول (غير مفضل في الإنتاج)
     * أو عناوين مفصولة بفواصل تُدمج مع القائمة المسموحة
     */
    corsOrigin: (process.env.CORS_ORIGIN || '').trim(),

    /** ضغط الاستجابات (gzip) — المعطّل بـ COMPRESSION_ENABLED=false */
    compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
    /** مستوى ضغط zlib 1–9 (افتراضي 6). أعلى = حجم أصغر وأبطأ CPU */
    compressionLevel: Math.min(9, Math.max(1, parseInt(process.env.COMPRESSION_LEVEL, 10) || 6)),
    /** الحد الأدنى لحجم الاستجابة لضغطها (بايت). الافتراضي 1024 */
    compressionThreshold: Math.max(0, parseInt(process.env.COMPRESSION_THRESHOLD, 10) || 1024),

    /** رؤوس Helmet — المعطّل بـ HELMET_ENABLED=false */
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',

    /** صيغة Morgan: combined, common, dev, short, tiny */
    morganFormat: (process.env.MORGAN_FORMAT || '').trim().toLowerCase(),

    /**
     * عدد عمليات cluster (0 = تعطيل). يُتجاهل على Vercel.
     * يُنصح بعدد نوى مناسب، ليس أكثر من os.cpus().length
     */
    clusterWorkers: Math.max(0, parseInt(process.env.CLUSTER_WORKERS, 10) || 0),

    // WhatsApp Settings
    enableWhatsApp: process.env.ENABLE_WHATSAPP === 'true',
    whatsappTimeout: process.env.WHATSAPP_TIMEOUT || 30000,

    // WebAuthn
    rpID: process.env.RP_ID || 'localhost',

    // Database
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/manahl-badr',

    // Google OAuth (تسجيل دخول العملاء — اختياري)
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    jwtExpire: process.env.JWT_EXPIRE || '24h',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key-change-this',
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',

    // Admin (سيتم إنشاء حساب المشرف الأول عند التشغيل الأول)
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminEmail: process.env.ADMIN_EMAIL || 'reefwosaab@gmail.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!',

    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: computeRateLimitMax(),

    // File Upload
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || process.env.UPLOAD_MAX_SIZE, 10) || 5 * 1024 * 1024,
    uploadPath: process.env.UPLOAD_PATH || 'uploads',

    // Email (Optional)
    emailHost: process.env.EMAIL_HOST,
    emailPort: process.env.EMAIL_PORT,
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,

    // SMS (Optional)
    twilioSid: process.env.TWILIO_SID,
    twilioToken: process.env.TWILIO_TOKEN,
    twilioPhone: process.env.TWILIO_PHONE,

    // Payment (Optional)
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,

    // Redis (Optional)
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT) || 6379,
    redisPassword: process.env.REDIS_PASSWORD,
    /** مهلة اتصال Redis (ms) — فشل سريع ثم الانتقال لذاكرة مؤقتة محلية */
    redisConnectTimeoutMs: Math.min(30000, Math.max(500, parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS, 10) || 2500)),
    /** إعادة اتصال (0 = تعطيل؛ مناسب إن لم يكن Redis يعمل دائماً مثل Vercel بدون Redis) */
    redisReconnectRetries: Math.max(0, parseInt(process.env.REDIS_RECONNECT_RETRIES, 10) || 0),
    redisRetryDelayMs: Math.max(10, parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILURE, 10) || 50),

    // VAPID Keys for Push Notifications (مجاني تماماً - يتم توليده تلقائياً)
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    vapidEmail: process.env.VAPID_EMAIL || 'admin@manahlbadr.com'
};

// تحذيرات التطوير
if (config.nodeEnv === 'development') {
    if (config.jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
        console.warn('⚠️  تحذير: JWT_SECRET افتراضي. غيّره في الإنتاج!');
    }
    if (config.adminPassword === 'ChangeThisPassword123!') {
        console.warn('⚠️  تحذير: ADMIN_PASSWORD افتراضي. غيّرها في .env أو من لوحة التحكم!');
    }
}
// في الإنتاج: منع تشغيل السيرفر بقيم افتراضية خطيرة
if (config.nodeEnv === 'production') {
    if (config.jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
        console.error('❌ في الإنتاج يجب تعيين JWT_SECRET في .env');
        process.exit(1);
    }
    if (!config.adminPassword || config.adminPassword.length < 6) {
        console.error('❌ في الإنتاج يجب تعيين ADMIN_PASSWORD في .env (6 أحرف على الأقل)');
        process.exit(1);
    }
    const frontend = (config.frontendUrl || '').toLowerCase();
    if (!frontend || frontend.startsWith('http://localhost') || frontend.startsWith('http://127.0.0.1')) {
        console.error('❌ في الإنتاج يجب تعيين FRONTEND_URL في .env بعنوان الموقع الحقيقي (مثل https://yourdomain.com)');
        process.exit(1);
    }
}

module.exports = config;











