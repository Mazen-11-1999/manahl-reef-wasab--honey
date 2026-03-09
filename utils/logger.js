/**
 * Logger Configuration
 * نظام التسجيل (Logging) باستخدام Winston
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

// إنشاء مجلد logs إذا لم يكن موجوداً
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// تنسيق السجلات
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// تنسيق للسجلات في Console (للتطوير)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// إنشاء Logger
const logger = winston.createLogger({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'manahl-badr-api' },
    transports: [
        // كتابة الأخطاء في ملف منفصل
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // كتابة جميع السجلات في ملف
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
    // معالجة الاستثناءات غير المعالجة
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
        }),
    ],
    // معالجة الوعود المرفوضة
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
        }),
    ],
});

// في بيئة التطوير، أضف Console transport
if (config.nodeEnv !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// دوال مساعدة
logger.info('✅ Logger initialized');

module.exports = logger;




















