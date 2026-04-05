/**
 * Authentication Controller
 * Controller للمصادقة وإدارة المستخدمين
 */

const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/env');
const logger = require('../utils/logger');

/** تطبيع رقم الهاتف للمقارنة (يمني محلي أو دولي E.164 بدون +) */
function normalizePhone(input) {
    if (!input || typeof input !== 'string') return '';
    const digits = input.replace(/\D/g, '');
    if (!digits) return '';
    // اليمن: 9 أرقام تبدأ بـ 7 بدون مفتاح الدولة
    if (digits.length === 9 && digits.startsWith('7')) {
        return '967' + digits;
    }
    // رقم دولي كامل (مفتاح دولة + وطني)، عادة 10–15 رقماً
    if (digits.length >= 10 && digits.length <= 15) {
        return digits;
    }
    // اليمن كاملاً 967 + 9 أرقام
    if (digits.length === 12 && digits.startsWith('967')) {
        return digits;
    }
    // إدخال طويل قديم: محاولة استخراج 967XXXXXXXXX
    if (digits.length > 12) {
        const idx = digits.indexOf('967');
        if (idx !== -1 && digits.length - idx >= 12) {
            return digits.substring(idx, idx + 12);
        }
    }
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
    if (normalized.length < 10) {
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

/** يجب أن يطابق المسار المسجّل في Google Cloud وـ FRONTEND_URL */
function getGoogleRedirectUri() {
    const base = (config.frontendUrl || '').replace(/\/$/, '');
    return `${base}/api/auth/google/callback`;
}

function httpsRequestJson(urlString, options) {
    return new Promise((resolve, reject) => {
        const u = new URL(urlString);
        const reqOpts = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        const req = https.request(reqOpts, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, json: JSON.parse(data || '{}'), raw: data });
                } catch (e) {
                    resolve({ status: res.statusCode, json: null, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function uniqueSyntheticPhoneFromSub(sub) {
    for (let i = 0; i < 8; i++) {
        const h = crypto.createHash('sha256').update(String(sub) + String(i)).digest();
        const num = h.readUInt32BE(0) % 100000000;
        const phone = '9677' + String(num).padStart(8, '0');
        const exists = await Customer.findOne({ phone });
        if (!exists) return phone;
    }
    return '9677' + String(Date.now()).slice(-8);
}

/**
 * GET /api/auth/google — إعادة توجيه إلى Google OAuth
 */
exports.googleAuthStart = catchAsync(async (req, res, next) => {
    if (!config.googleClientId || !config.googleClientSecret) {
        return next(new AppError('تسجيل الدخول بـ Google غير مُفعّل. أضف GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET في إعدادات الخادم.', 503));
    }
    const state = jwt.sign(
        { p: 'g_oauth', rnd: crypto.randomBytes(8).toString('hex') },
        config.jwtSecret,
        { expiresIn: '10m' }
    );
    const redirectUri = encodeURIComponent(getGoogleRedirectUri());
    const scope = encodeURIComponent('openid email profile');
    const url =
        'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${encodeURIComponent(config.googleClientId)}` +
        `&redirect_uri=${redirectUri}` +
        '&response_type=code' +
        `&scope=${scope}` +
        `&state=${encodeURIComponent(state)}` +
        '&prompt=select_account';
    res.redirect(302, url);
});

/**
 * GET /api/auth/google/callback — استلام الرمز وإصدار JWT للموقع
 */
exports.googleAuthCallback = catchAsync(async (req, res, next) => {
    const frontBase = (config.frontendUrl || '').replace(/\/$/, '');
    const authPage = `${frontBase}/pages/customer-auth.html`;

    if (req.query.error) {
        logger.warn('Google OAuth error query', { error: req.query.error });
        return res.redirect(302, `${authPage}?google_error=access_denied`);
    }

    const { code, state } = req.query;
    if (!code || !state) {
        return res.redirect(302, `${authPage}?google_error=invalid_request`);
    }

    let decoded;
    try {
        decoded = jwt.verify(state, config.jwtSecret);
    } catch (e) {
        return res.redirect(302, `${authPage}?google_error=state_expired`);
    }
    if (decoded.p !== 'g_oauth') {
        return next(new AppError('طلب غير صالح', 400));
    }

    if (!config.googleClientId || !config.googleClientSecret) {
        return next(new AppError('إعداد Google غير مكتمل', 503));
    }

    const redirectUri = getGoogleRedirectUri();
    const tokenBody = new URLSearchParams({
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    }).toString();

    const tokenResult = await httpsRequestJson('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(tokenBody)
        },
        body: tokenBody
    });
    const tokenJson = tokenResult.json || {};
    if (!tokenResult.status || tokenResult.status < 200 || tokenResult.status >= 300 || !tokenJson.access_token) {
        logger.error('Google token exchange failed', { status: tokenResult.status, tokenJson });
        return res.redirect(302, `${authPage}?google_error=token`);
    }

    const uiUrl = `https://www.googleapis.com/oauth2/v3/userinfo`;
    const userinfoRes = await httpsRequestJson(uiUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    const profile = userinfoRes.json || {};
    if (!profile.sub || !profile.email) {
        return res.redirect(302, `${authPage}?google_error=profile`);
    }
    if (profile.email_verified === false) {
        return res.redirect(302, `${authPage}?google_error=email_not_verified`);
    }

    const email = String(profile.email).toLowerCase().trim();
    const sub = String(profile.sub);
    const given = (profile.given_name || '').trim();
    const family = (profile.family_name || '').trim();
    const nameFromGoogle = [given, family].filter(Boolean).join(' ') || (profile.name || '').trim() || 'عميل';

    let user = await User.findOne({ googleId: sub });
    if (!user) {
        user = await User.findOne({ email });
    }

    if (user) {
        if (!user.googleId) {
            user.googleId = sub;
        }
        user.lastLogin = new Date();
        if (profile.picture && !user.profile?.avatar) {
            user.profile = user.profile || {};
            user.profile.avatar = profile.picture;
        }
        user.isEmailVerified = true;
        await user.save({ validateBeforeSave: false });

        const cust = await Customer.findOne({ user: user._id });
        if (cust && profile.picture && !cust.profile?.avatar) {
            cust.profile = cust.profile || {};
            cust.profile.avatar = profile.picture;
            await cust.save({ validateBeforeSave: false });
        }
    } else {
        const username = (`g_${sub}`).slice(0, 30);
        const randPass = crypto.randomBytes(32).toString('hex');
        const phone = await uniqueSyntheticPhoneFromSub(sub);

        user = await User.create({
            username,
            email,
            googleId: sub,
            password: randPass,
            role: 'user',
            profile: {
                firstName: given || nameFromGoogle,
                lastName: family,
                avatar: profile.picture || undefined
            },
            isEmailVerified: true,
            lastLogin: new Date()
        });

        await Customer.create({
            user: user._id,
            email,
            phone,
            profile: {
                firstName: given || nameFromGoogle,
                lastName: family,
                avatar: profile.picture || undefined
            },
            loyalty: { points: 0, tier: 'bronze', totalSpent: 0, totalOrders: 0 }
        });
    }

    if (!user.isActive) {
        return res.redirect(302, `${authPage}?google_error=disabled`);
    }

    if (user.role === 'admin' || user.role === 'moderator') {
        return res.redirect(302, `${authPage}?google_error=admin_account`);
    }

    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    const hash =
        `#google=1&token=${encodeURIComponent(token)}&refresh=${encodeURIComponent(refreshToken)}`;
    return res.redirect(302, `${authPage}${hash}`);
});

/**
 * تحديث Token باستخدام Refresh Token
 */
exports.refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new AppError('Refresh Token مطلوب', 400));
    }
    
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




















