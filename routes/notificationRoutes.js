/**
 * Notification Routes
 * Routes لإدارة الإشعارات
 */

const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');
const { param, query } = require('express-validator');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Route للحصول على VAPID Public Key (لا يتطلب مصادقة - مجاني تماماً)
router.get('/vapid-public-key',
    notificationController.getVAPIDPublicKey
);

// جميع الـ routes الأخرى تتطلب مصادقة
router.use(authenticateToken);

// Validation
const markAsReadValidation = [
    param('id').isMongoId().withMessage('معرف الإشعار غير صحيح')
];

// Routes
router.get('/',
    query('unreadOnly').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
    notificationController.getNotifications
);

router.get('/unread-count',
    notificationController.getUnreadCount
);

router.put('/:id/read',
    markAsReadValidation,
    validate,
    notificationController.markAsRead
);

router.put('/read-all',
    notificationController.markAllAsRead
);

// Routes للاشتراك/إلغاء الاشتراك (تتطلب مصادقة)
router.post('/subscribe',
    notificationController.subscribe
);

router.post('/unsubscribe',
    notificationController.unsubscribe
);

// Route لإرسال إشعارات جماعية (للمشرفين فقط)
const { requireAdmin } = require('../middleware/auth');
router.post('/send-bulk',
    requireAdmin,
    notificationController.sendBulkNotification
);

module.exports = router;










