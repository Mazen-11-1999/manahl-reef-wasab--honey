/**
 * Authentication Middleware
 * Middleware للمصادقة والتفويض
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/appError');
const User = require('../models/User');

/**
 * التحقق من JWT Token
 */
const authenticateToken = async (req, res, next) => {
    try {
        // الحصول على Token من Header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return next(new AppError('رمز الوصول مطلوب. يرجى تسجيل الدخول!', 401));
        }

        // التحقق من Token
        const decoded = jwt.verify(token, config.jwtSecret);

        // جلب بيانات المستخدم من قاعدة البيانات
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return next(new AppError('المستخدم غير موجود', 401));
        }

        // إضافة بيانات المستخدم إلى الطلب
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('رمز الوصول غير صالح', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('انتهت صلاحية رمز الوصول', 401));
        }
        next(error);
    }
};

/**
 * التحقق من صلاحيات المشرف
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new AppError('يجب تسجيل الدخول أولاً', 401));
    }

    if (req.user.role !== 'admin') {
        return next(new AppError('ليس لديك صلاحية للوصول إلى هذا المورد', 403));
    }

    next();
};

/**
 * مصادقة اختيارية: إذا وُجد Token صالح يُضاف المستخدم إلى req.user، وإلا لا يُرمى خطأ (لربط الطلبات بالمستخدم عند إنشائها)
 */
const authenticateTokenOptional = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return next();
        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findById(decoded.id).select('-password');
        if (user) req.user = user;
        next();
    } catch (e) {
        next();
    }
};

/**
 * التحقق من صلاحيات المستخدم (المستخدم نفسه أو المشرف)
 */
const requireOwnerOrAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new AppError('يجب تسجيل الدخول أولاً', 401));
    }

    const resourceUserId = req.params.userId || req.body.userId;
    
    if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
        return next();
    }

    return next(new AppError('ليس لديك صلاحية للوصول إلى هذا المورد', 403));
};

module.exports = {
    authenticateToken,
    authenticateTokenOptional,
    requireAdmin,
    requireOwnerOrAdmin
};




















