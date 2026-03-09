/**
 * Analytics Routes
 * Routes للتحليلات والإحصائيات
 */

const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const trackEventValidation = [
    body('eventType')
        .notEmpty()
        .withMessage('نوع الحدث مطلوب')
        .isIn([
            'page_view',
            'product_view',
            'add_to_cart',
            'remove_from_cart',
            'checkout_start',
            'checkout_complete',
            'purchase',
            'search',
            'filter',
            'review_submit',
            'wishlist_add',
            'wishlist_remove',
            'login',
            'register',
            'logout',
            'email_click',
            'sms_click'
        ])
        .withMessage('نوع الحدث غير صحيح'),
    body('productId')
        .optional()
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح'),
    body('orderId')
        .optional()
        .isMongoId()
        .withMessage('معرف الطلب غير صحيح'),
    body('value')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('القيمة يجب أن تكون رقماً موجباً')
];

// Public route - تسجيل الأحداث (لا يتطلب مصادقة)
router.post('/track', trackEventValidation, validate, analyticsController.trackEvent);

// Protected routes (require authentication)
router.get('/events', 
    authenticateToken,
    analyticsController.getUserEvents
);

// Admin routes
router.get('/stats',
    authenticateToken,
    requireAdmin,
    query('eventType').notEmpty().withMessage('نوع الحدث مطلوب'),
    query('startDate').optional().isISO8601().withMessage('تاريخ البداية غير صحيح'),
    query('endDate').optional().isISO8601().withMessage('تاريخ النهاية غير صحيح'),
    validate,
    analyticsController.getEventStats
);

router.get('/funnel',
    authenticateToken,
    requireAdmin,
    query('startDate').optional().isISO8601().withMessage('تاريخ البداية غير صحيح'),
    query('endDate').optional().isISO8601().withMessage('تاريخ النهاية غير صحيح'),
    validate,
    analyticsController.getConversionFunnel
);

router.get('/top-products',
    authenticateToken,
    requireAdmin,
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('startDate').optional().isISO8601().withMessage('تاريخ البداية غير صحيح'),
    query('endDate').optional().isISO8601().withMessage('تاريخ النهاية غير صحيح'),
    validate,
    analyticsController.getTopViewedProducts
);

router.get('/sales',
    authenticateToken,
    requireAdmin,
    query('startDate').optional().isISO8601().withMessage('تاريخ البداية غير صحيح'),
    query('endDate').optional().isISO8601().withMessage('تاريخ النهاية غير صحيح'),
    query('groupBy').optional().isIn(['hour', 'day', 'week', 'month']),
    validate,
    analyticsController.getSalesStats
);

module.exports = router;




















