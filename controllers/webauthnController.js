/**
 * WebAuthn Controller
 * Controller لإدارة المصادقة بالبصمة
 */

const { generateRegistrationOptions, verifyRegistrationResponse } = require('@simplewebauthn/server');
const { generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const WebAuthnCredential = require('../models/WebAuthnCredential');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/env');

// Relying Party (RP) Information — آمن ضد أخطاء الإعدادات
const rpName = 'مناحل ريف وصاب';
let rpID = process.env.RP_ID;
let origin = config.frontendUrl || '';
if (!rpID) {
    try {
        const url = new URL(origin || 'http://localhost');
        rpID = url.hostname.split(':')[0] || 'localhost';
    } catch (e) {
        rpID = 'localhost';
    }
}
if (!origin || typeof origin !== 'string') {
    try {
        const fallback = process.env.NODE_ENV === 'production' ? (process.env.FRONTEND_URL || '') : 'http://localhost:3001';
        origin = (config.frontendUrl && config.frontendUrl.trim()) || fallback || 'http://localhost:3001';
    } catch (e) {
        origin = 'http://localhost:3001';
    }
}

// Simple in-memory store for challenges (في الإنتاج، استخدم Redis)
const challengeStore = new Map();

/**
 * بدء عملية تسجيل البصمة
 */
exports.startRegistration = catchAsync(async (req, res, next) => {
    // التحقق من أن المستخدم مسجل دخول كـ admin
    const adminToken = req.headers.authorization?.replace('Bearer ', '');
    if (!adminToken) {
        return next(new AppError('يجب تسجيل الدخول أولاً', 401));
    }

    // فك تشفير Token للتحقق من admin
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
        decoded = jwt.verify(adminToken, config.jwtSecret);
    } catch (error) {
        return next(new AppError('Token غير صالح', 401));
    }

    // جلب admin user
    const admin = await User.findById(decoded.id);
    if (!admin || admin.role !== 'admin') {
        return next(new AppError('ليس لديك صلاحية', 403));
    }

    // جلب البصمات الموجودة
    const existingCredentials = await WebAuthnCredential.find({ userID: admin._id });
    
    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: admin._id.toString(),
        userName: admin.username || 'admin',
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: existingCredentials.map(cred => ({
            id: Buffer.from(cred.credentialID, 'base64'),
            type: 'public-key',
            transports: ['internal', 'usb', 'nfc', 'ble']
        })),
        authenticatorSelection: {
            authenticatorAttachment: 'platform', // للهواتف
            userVerification: 'preferred',
            requireResidentKey: false
        },
        supportedAlgorithmIDs: [-7, -257] // ES256, RS256
    });

    // حفظ challenge مؤقتاً
    const challengeId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    challengeStore.set(challengeId, {
        challenge: options.challenge,
        userID: admin._id.toString(),
        expiresAt: Date.now() + 60000 // 60 ثانية
    });
    
    // إضافة challengeId للاستجابة
    options.challengeId = challengeId;

    res.status(200).json({
        success: true,
        options
    });
});

/**
 * إكمال عملية تسجيل البصمة
 */
exports.completeRegistration = catchAsync(async (req, res, next) => {
    const { credential, deviceName, deviceType } = req.body;
    
    if (!credential) {
        return next(new AppError('بيانات البصمة مطلوبة', 400));
    }

    // التحقق من challenge
    const { challengeId } = credential;
    if (!challengeId) {
        return next(new AppError('معرف التحدي مفقود', 400));
    }

    const storedChallenge = challengeStore.get(challengeId);
    if (!storedChallenge) {
        return next(new AppError('التحدي غير صالح أو منتهي الصلاحية', 400));
    }

    // التحقق من انتهاء الصلاحية
    if (Date.now() > storedChallenge.expiresAt) {
        challengeStore.delete(challengeId);
        return next(new AppError('التحدي منتهي الصلاحية', 400));
    }

    // التحقق من أن المستخدم مسجل دخول
    const adminToken = req.headers.authorization?.replace('Bearer ', '');
    if (!adminToken) {
        return next(new AppError('يجب تسجيل الدخول أولاً', 401));
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
        decoded = jwt.verify(adminToken, config.jwtSecret);
    } catch (error) {
        return next(new AppError('Token غير صالح', 401));
    }

    const admin = await User.findById(decoded.id);
    if (!admin || admin.role !== 'admin') {
        return next(new AppError('ليس لديك صلاحية', 403));
    }

    const expectedOrigin = req.headers.origin || origin;
    // التحقق من استجابة التسجيل
    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge: storedChallenge.challenge,
            expectedOrigin: expectedOrigin,
            expectedRPID: rpID
        });
    } catch (error) {
        challengeStore.delete(challengeId);
        return next(new AppError(`فشل التحقق من البصمة: ${error.message}`, 400));
    }

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
        return next(new AppError('فشل التحقق من البصمة', 400));
    }

    // حفظ البصمة في قاعدة البيانات
    const newCredential = await WebAuthnCredential.create({
        credentialID: Buffer.from(credential.id, 'base64url').toString('base64'),
        userID: admin._id,
        publicKey: Buffer.from(registrationInfo.credentialPublicKey).toString('base64'),
        counter: registrationInfo.counter || 0,
        deviceName: deviceName || 'جهاز غير معروف',
        deviceType: deviceType || 'unknown',
        lastUsed: new Date()
    });

    // مسح challenge
    challengeStore.delete(challengeId);

    res.status(200).json({
        success: true,
        message: 'تم تسجيل البصمة بنجاح',
        credential: {
            id: newCredential._id,
            deviceName: newCredential.deviceName,
            deviceType: newCredential.deviceType,
            createdAt: newCredential.createdAt
        }
    });
});

/**
 * بدء عملية تسجيل الدخول بالبصمة
 */
exports.startAuthentication = catchAsync(async (req, res, next) => {
    // جلب admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
        return next(new AppError('حساب المشرف غير موجود', 404));
    }

    // جلب البصمات المسجلة
    const credentials = await WebAuthnCredential.find({ userID: admin._id });
    
    if (credentials.length === 0) {
        return next(new AppError('لا توجد بصمات مسجلة', 404));
    }

    const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: credentials.map(cred => ({
            id: Buffer.from(cred.credentialID, 'base64'),
            type: 'public-key',
            transports: ['internal', 'usb', 'nfc', 'ble']
        })),
        userVerification: 'preferred',
        timeout: 60000
    });

    // حفظ challenge مؤقتاً
    const challengeId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    challengeStore.set(challengeId, {
        challenge: options.challenge,
        expiresAt: Date.now() + 60000 // 60 ثانية
    });
    
    // إضافة challengeId للاستجابة
    options.challengeId = challengeId;

    res.status(200).json({
        success: true,
        options
    });
});

/**
 * إكمال عملية تسجيل الدخول بالبصمة
 */
exports.completeAuthentication = catchAsync(async (req, res, next) => {
    const { credential } = req.body;
    
    if (!credential) {
        return next(new AppError('بيانات البصمة مطلوبة', 400));
    }

    // التحقق من challenge أولاً
    const { challengeId } = credential;
    if (!challengeId) {
        return next(new AppError('معرف التحدي مفقود', 400));
    }

    const storedChallenge = challengeStore.get(challengeId);
    if (!storedChallenge) {
        return next(new AppError('التحدي غير صالح أو منتهي الصلاحية', 400));
    }

    // التحقق من انتهاء الصلاحية
    if (Date.now() > storedChallenge.expiresAt) {
        challengeStore.delete(challengeId);
        return next(new AppError('التحدي منتهي الصلاحية', 400));
    }

    // جلب admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
        return next(new AppError('حساب المشرف غير موجود', 404));
    }

    // جلب البصمة من قاعدة البيانات
    const credentialIDBase64 = Buffer.from(credential.id, 'base64url').toString('base64');
    const storedCredential = await WebAuthnCredential.findOne({ 
        credentialID: credentialIDBase64,
        userID: admin._id 
    });

    if (!storedCredential) {
        challengeStore.delete(challengeId);
        return next(new AppError('البصمة غير مسجلة', 404));
    }

    const expectedOrigin = req.headers.origin || origin;
    // التحقق من استجابة المصادقة
    let verification;
    try {
        verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge: storedChallenge.challenge,
            expectedOrigin: expectedOrigin,
            expectedRPID: rpID,
            credential: {
                id: Buffer.from(storedCredential.credentialID, 'base64'),
                publicKey: Buffer.from(storedCredential.publicKey, 'base64'),
                counter: storedCredential.counter
            }
        });
    } catch (error) {
        challengeStore.delete(challengeId);
        return next(new AppError(`فشل التحقق من البصمة: ${error.message}`, 400));
    }

    const { verified, authenticationInfo } = verification;

    if (!verified) {
        return next(new AppError('فشل التحقق من البصمة', 400));
    }

    // تحديث counter وآخر استخدام
    storedCredential.counter = authenticationInfo.newCounter;
    storedCredential.lastUsed = new Date();
    await storedCredential.save();

    // تحديث آخر تسجيل دخول
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // إنشاء Token
    const token = admin.generateAuthToken();

    // مسح challenge
    challengeStore.delete(challengeId);

    res.status(200).json({
        success: true,
        token,
        message: 'تم تسجيل الدخول بالبصمة بنجاح'
    });
});

/**
 * جلب قائمة البصمات المسجلة
 */
exports.getCredentials = catchAsync(async (req, res, next) => {
    const adminToken = req.headers.authorization?.replace('Bearer ', '');
    if (!adminToken) {
        return next(new AppError('يجب تسجيل الدخول أولاً', 401));
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
        decoded = jwt.verify(adminToken, config.jwtSecret);
    } catch (error) {
        return next(new AppError('Token غير صالح', 401));
    }

    const admin = await User.findById(decoded.id);
    if (!admin || admin.role !== 'admin') {
        return next(new AppError('ليس لديك صلاحية', 403));
    }

    const credentials = await WebAuthnCredential.find({ userID: admin._id })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        credentials: credentials.map(cred => ({
            id: cred._id,
            deviceName: cred.deviceName,
            deviceType: cred.deviceType,
            createdAt: cred.createdAt,
            lastUsed: cred.lastUsed,
            counter: cred.counter
        }))
    });
});

/**
 * حذف بصمة
 */
exports.deleteCredential = catchAsync(async (req, res, next) => {
    const { credentialId } = req.params;

    const adminToken = req.headers.authorization?.replace('Bearer ', '');
    if (!adminToken) {
        return next(new AppError('يجب تسجيل الدخول أولاً', 401));
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
        decoded = jwt.verify(adminToken, config.jwtSecret);
    } catch (error) {
        return next(new AppError('Token غير صالح', 401));
    }

    const admin = await User.findById(decoded.id);
    if (!admin || admin.role !== 'admin') {
        return next(new AppError('ليس لديك صلاحية', 403));
    }

    const credential = await WebAuthnCredential.findOne({
        _id: credentialId,
        userID: admin._id
    });

    if (!credential) {
        return next(new AppError('البصمة غير موجودة', 404));
    }

    await WebAuthnCredential.findByIdAndDelete(credentialId);

    res.status(200).json({
        success: true,
        message: 'تم حذف البصمة بنجاح'
    });
});

