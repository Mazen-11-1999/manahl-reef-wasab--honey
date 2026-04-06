/**
 * Authentication Routes
 * Routes للمصادقة وإدارة المستخدمين
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const loginValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('اسم المستخدم مطلوب'),
    body('password')
        .notEmpty()
        .withMessage('كلمة المرور مطلوبة')
        .isLength({ min: 8 })
        .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
];

const registerValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('اسم المستخدم مطلوب')
        .isLength({ min: 3, max: 30 })
        .withMessage('اسم المستخدم يجب أن يكون بين 3 و 30 حرفاً'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('البريد الإلكتروني مطلوب')
        .isEmail()
        .withMessage('البريد الإلكتروني غير صحيح')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('كلمة المرور مطلوبة')
        .isLength({ min: 8 })
        .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('كلمة المرور يجب أن تحتوي على حرف صغير، حرف كبير، ورقم'),
    body('phone')
        .optional()
        .trim()
        .isMobilePhone('ar-SA')
        .withMessage('رقم الهاتف غير صحيح'),
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('الاسم الأول يجب أن يكون بين 2 و 50 حرفاً'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('اسم العائلة يجب أن يكون بين 2 و 50 حرفاً')
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('كلمة المرور الحالية مطلوبة'),
    body('newPassword')
        .notEmpty()
        .withMessage('كلمة المرور الجديدة مطلوبة')
        .isLength({ min: 8 })
        .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('كلمة المرور يجب أن تحتوي على حرف صغير، حرف كبير، ورقم')
];

const forgotPasswordValidation = [
    body('email')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail()
        .withMessage('البريد الإلكتروني غير صحيح')
        .normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).trim(),
    body().custom((_, { req }) => {
        const hasEmail = req.body.email && String(req.body.email).trim();
        const hasPhone = req.body.phone && String(req.body.phone).trim();
        if (!hasEmail && !hasPhone) {
            throw new Error('يرجى إدخال البريد الإلكتروني أو رقم الهاتف');
        }
        return true;
    })
];

const resetPasswordValidation = [
    body('token')
        .notEmpty()
        .withMessage('Token مطلوب'),
    body('password')
        .notEmpty()
        .withMessage('كلمة المرور مطلوبة')
        .isLength({ min: 8 })
        .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
];

// تسجيل عميل (هاتف + اسم + كلمة مرور فقط)
const registerCustomerValidation = [
    body('phone').trim().notEmpty().withMessage('رقم الهاتف مطلوب'),
    body('name').trim().notEmpty().withMessage('الاسم مطلوب').isLength({ min: 2, max: 100 }).withMessage('الاسم بين 2 و 100 حرف'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة').isLength({ min: 8 }).withMessage('كلمة المرور 8 أحرف على الأقل')
];

// Google OAuth (عملاء — يجب أن يطابق المسار في Google Cloud)
router.get('/google/callback', authController.googleAuthCallback);
router.get('/google', authController.googleAuthStart);

// Routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/register-customer', registerCustomerValidation, validate, authController.registerCustomer);
router.post('/login', loginValidation, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, authController.resetPassword);
router.post('/logout', authenticateToken, authController.logout);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.put('/me', authenticateToken, authController.updateMe);
router.put('/change-password', authenticateToken, changePasswordValidation, validate, authController.changePassword);

module.exports = router;




















