/**
 * Global Error Handler Middleware
 * معالجة الأخطاء الشاملة
 */

const AppError = require('../utils/appError');
const config = require('../config/env');

/**
 * معالجة أخطاء Cast (ObjectId غير صحيح)
 */
const handleCastErrorDB = (err) => {
    const message = `المورد غير موجود: ${err.path}`;
    return new AppError(message, 400);
};

/**
 * معالجة أخطاء Duplicate Fields
 */
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `القيمة ${value} مستخدمة بالفعل. يرجى استخدام قيمة أخرى`;
    return new AppError(message, 400);
};

/**
 * معالجة أخطاء Validation
 */
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `بيانات غير صحيحة: ${errors.join('. ')}`;
    const error = new AppError(message, 400);
    return error;
};

/**
 * معالجة أخطاء JWT
 */
const handleJWTError = () => {
    return new AppError('رمز الوصول غير صالح. يرجى تسجيل الدخول مرة أخرى', 401);
};

/**
 * معالجة أخطاء JWT Expired
 */
const handleJWTExpiredError = () => {
    return new AppError('انتهت صلاحية رمز الوصول. يرجى تسجيل الدخول مرة أخرى', 401);
};

/**
 * معالجة أخطاء MongoDB
 */
const handleMongoError = (err) => {
    if (err.name === 'MongoNetworkError') {
        console.error('MongoNetworkError:', err.message);
        return new AppError('فشل الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً', 503);
    }
    if (err.name === 'MongoTimeoutError') {
        console.error('MongoTimeoutError:', err.message);
        return new AppError('انتهت مهلة الاتصال بقاعدة البيانات', 503);
    }
    if (err.name === 'MongoServerError') {
        console.error('MongoServerError:', err.message);
        return new AppError('خطأ في خادم قاعدة البيانات', 503);
    }
    if (err.name === 'MongoError') {
        console.error('MongoError:', err.message);
        return new AppError('خطأ في قاعدة البيانات', 503);
    }
    console.error('Unknown MongoDB Error:', err);
    return new AppError('خطأ في قاعدة البيانات', 503);
};

/**
 * إرسال رسالة خطأ في بيئة التطوير
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

/**
 * إرسال رسالة خطأ في بيئة الإنتاج
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥', err);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'حدث خطأ ما. يرجى المحاولة لاحقاً'
        });
    }
};

/**
 * Global Error Handler
 */
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.nodeEnv === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };

        // معالجة أنواع الأخطاء المختلفة
        if (err.name === 'CastError') error = handleCastErrorDB(err);
        if (err.code === 11000) error = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        // معالجة أخطاء MongoDB
        if (err.name === 'MongoNetworkError') error = handleMongoError(err);
        if (err.name === 'MongoTimeoutError') error = handleMongoError(err);
        if (err.name === 'MongoServerError') error = handleMongoError(err);
        if (err.name === 'MongoError') error = handleMongoError(err);

        sendErrorProd(error, res);
    }
};
