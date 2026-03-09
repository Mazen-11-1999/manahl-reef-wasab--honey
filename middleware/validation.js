/**
 * Validation Middleware
 * Middleware للتحقق من صحة البيانات المدخلة
 */

const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * التحقق من نتائج Validation
 */
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));

        // تسجيل محاولات إدخال بيانات غير صحيحة
        logger.warn('Validation failed', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            errors: errorMessages,
            timestamp: new Date().toISOString()
        });

        const error = new AppError('بيانات غير صحيحة', 400);
        error.errors = errorMessages;
        return next(error);
    }
    
    next();
};

/**
 * Sanitize input data
 * تنظيف البيانات المدخلة
 */
exports.sanitize = (req, res, next) => {
    // تنظيف البيانات من HTML tags
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    
    next();
};

