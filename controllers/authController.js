/**
 * Authentication Controller
 * Controller للمصادقة وإدارة المستخدمين
 */

const User = require('../models/User');
const Customer = require('../models/Customer');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/env');

/** تطبيع رقم الهاتف للمقارنة */
function normalizePhone(input) {
    if (!input || typeof input !== 'string') return '';
    const digits = input.replace(/\D/g, '');
    if (digits.length === 9 && digits.startsWith('7')) return '967' + digits;
    if (digits.length >= 10) return digits.slice(-9).replace(/^/, '967');
    return digits;
}

/**
 * تسجيل الدخول (يدعم: اسم المستخدم، البريد، أو رقم الهاتف)
 */
exports.login = catchAsync(async (req, res, next) => {
    const { username, password } = req.body;

    // التحقق من وجود البيانات
    if (!username || !password) {
        return next(new AppError('يرجى إدخال رقم الهاتف أو البريد وكلمة المرور', 400));
    }

    const trimmed = username.trim();
    const isPhone = /^[\d+\s\-()]+$/.test(trimmed.replace(/\s/g, ''));
    const query = isPhone
        ? { 'profile.phone': normalizePhone(trimmed) || trimmed }
        : { $or: [{ username: trimmed }, { email: trimmed.toLowerCase() }] };

    // جلب المستخدم مع كلمة المرور
    const user = await User.findOne(query).select('+password');

    // التحقق من وجود المستخدم وصحة كلمة المرور
    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('اسم المستخدم أو كلمة المرور غير صحيحة', 401));
    }

    // التحقق من أن المستخدم نشط
    if (!user.isActive) {
        return next(new AppError('تم تعطيل حسابك. يرجى التواصل مع الإدارة', 403));
    }

    // تحديث آخر تسجيل دخول
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // إنشاء Tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // إزالة كلمة المرور من الاستجابة
    user.password = undefined;

    res.status(200).json({
        success: true,
        token,
        refreshToken,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
            vipStatus: user.vipStatus,
            badgeType: user.badgeType || 'none'
        }
    });
});

/**
 * تسجيل مستخدم جديد
 */
exports.register = catchAsync(async (req, res, next) => {
    const { username, email, password, phone, firstName, lastName } = req.body;

    // التحقق من وجود البيانات المطلوبة
    if (!username || !email || !password) {
        return next(new AppError('يرجى إدخال جميع البيانات المطلوبة', 400));
    }

    // التحقق من عدم وجود مستخدم بنفس الاسم أو البريد
    const existingUser = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    });

    if (existingUser) {
        return next(new AppError('اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل', 400));
    }

    // إنشاء مستخدم جديد
    const user = await User.create({
        username,
        email,
        password,
        profile: {
            firstName,
            lastName,
            phone
        }
    });

    // إنشاء Tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // إزالة كلمة المرور من الاستجابة
    user.password = undefined;

    res.status(201).json({
        success: true,
        message: 'تم إنشاء الحساب بنجاح',
        token,
        refreshToken,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile
        }
    });
});

/**
 * تسجيل عميل جديد (رقم هاتف + اسم + كلمة مرور) — بدون بريد، وإنشاء سجل Customer
 */
exports.registerCustomer = catchAsync(async (req, res, next) => {
    const { phone, name, password } = req.body;
    if (!phone || !name || !password) {
        return next(new AppError('رقم الهاتف والاسم وكلمة المرور مطلوبة', 400));
    }
    const normalized = normalizePhone(phone);
    if (normalized.length < 9) {
        return next(new AppError('رقم الهاتف غير صحيح', 400));
    }
    const nameTrim = name.trim();
    if (nameTrim.length < 2) {
        return next(new AppError('الاسم يجب أن يكون حرفين على الأقل', 400));
    }
    if (password.length < 8) {
        return next(new AppError('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 400));
    }

    const existingByPhone = await User.findOne({ 'profile.phone': normalized });
    if (existingByPhone) {
        return next(new AppError('رقم الهاتف مسجّل مسبقاً. استخدم تسجيل الدخول', 400));
    }

    const internalEmail = `${normalized}@customer.manahl.local`;
    const existingEmail = await User.findOne({ email: internalEmail });
    if (existingEmail) {
        return next(new AppError('رقم الهاتف مسجّل مسبقاً. استخدم تسجيل الدخول', 400));
    }

    const user = await User.create({
        username: 'c_' + normalized,
        email: internalEmail,
        password,
        role: 'user',
        profile: {
            firstName: nameTrim,
            lastName: '',
            phone: normalized
        }
    });

    await Customer.create({
        user: user._id,
        email: internalEmail,
        phone: normalized,
        profile: { firstName: nameTrim, lastName: '' },
        loyalty: { points: 0, tier: 'bronze', totalSpent: 0, totalOrders: 0 }
    });

    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    user.password = undefined;

    res.status(201).json({
        success: true,
        message: 'تم إنشاء حسابك بنجاح',
        token,
        refreshToken,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
            badgeType: user.badgeType || 'none'
        }
    });
});

/**
 * تحديث Token باستخدام Refresh Token
 */
exports.refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new AppError('Refresh Token مطلوب', 400));
    }

    const jwt = require('jsonwebtoken');
    
    try {
        // التحقق من Refresh Token
        const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);

        // جلب المستخدم
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return next(new AppError('المستخدم غير موجود أو غير نشط', 401));
        }

        // إنشاء Token جديد
        const newToken = user.generateAuthToken();

        res.status(200).json({
            success: true,
            token: newToken
        });
    } catch (error) {
        return next(new AppError('Refresh Token غير صالح', 401));
    }
});

/**
 * الحصول على بيانات المستخدم الحالي
 */
exports.getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    });
});

/**
 * تحديث بيانات المستخدم
 */
exports.updateMe = catchAsync(async (req, res, next) => {
    const { firstName, lastName, phone, address, dateOfBirth, gender } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user.id,
        {
            profile: {
                firstName,
                lastName,
                phone,
                address,
                dateOfBirth,
                gender
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        message: 'تم تحديث البيانات بنجاح',
        user
    });
});

/**
 * تغيير كلمة المرور
 */
exports.changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new AppError('يرجى إدخال كلمة المرور الحالية والجديدة', 400));
    }

    // جلب المستخدم مع كلمة المرور
    const user = await User.findById(req.user.id).select('+password');

    // التحقق من كلمة المرور الحالية
    if (!(await user.comparePassword(currentPassword))) {
        return next(new AppError('كلمة المرور الحالية غير صحيحة', 401));
    }

    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();

    // إنشاء Token جديد
    const token = user.generateAuthToken();

    res.status(200).json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح',
        token
    });
});

/**
 * طلب إعادة تعيين كلمة المرور
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('يرجى إدخال البريد الإلكتروني', 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
        // لا نكشف عن وجود المستخدم أم لا لأسباب أمنية
        return res.status(200).json({
            success: true,
            message: 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين'
        });
    }

    // إنشاء Reset Token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // TODO: إرسال البريد الإلكتروني مع رابط إعادة التعيين
    // const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    // await sendEmail(user.email, 'إعادة تعيين كلمة المرور', resetURL);

    res.status(200).json({
        success: true,
        message: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني',
        resetToken // في الإنتاج، لا ترسل هذا في الاستجابة!
    });
});

/**
 * إعادة تعيين كلمة المرور
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return next(new AppError('Token وكلمة المرور مطلوبان', 400));
    }

    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
        return next(new AppError('Token غير صالح أو منتهي الصلاحية', 400));
    }

    // تحديث كلمة المرور
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // إنشاء Token جديد
    const authToken = user.generateAuthToken();

    res.status(200).json({
        success: true,
        message: 'تم إعادة تعيين كلمة المرور بنجاح',
        token: authToken
    });
});

/**
 * تسجيل الخروج
 */
exports.logout = catchAsync(async (req, res, next) => {
    // في حالة استخدام Refresh Token blacklist، يمكن إضافة المنطق هنا
    res.status(200).json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
    });
});




















