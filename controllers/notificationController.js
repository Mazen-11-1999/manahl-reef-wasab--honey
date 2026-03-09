/**
 * Notification Controller
 * Controller لإدارة الإشعارات داخل التطبيق
 */

const notificationService = require('../services/notificationService');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * الحصول على إشعارات المستخدم
 */
exports.getNotifications = catchAsync(async (req, res, next) => {
    const { unreadOnly = false, limit = 50 } = req.query;

    const notifications = await notificationService.getUserNotifications(
        req.user.id,
        parseInt(limit),
        unreadOnly === 'true'
    );

    res.status(200).json({
        success: true,
        notifications
    });
});

/**
 * الحصول على عدد الإشعارات غير المقروءة
 */
exports.getUnreadCount = catchAsync(async (req, res, next) => {
    const count = await notificationService.getUnreadCount(req.user.id);

    res.status(200).json({
        success: true,
        count
    });
});

/**
 * قراءة إشعار
 */
exports.markAsRead = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, req.user.id);

    if (!notification) {
        return next(new AppError('الإشعار غير موجود', 404));
    }

    res.status(200).json({
        success: true,
        message: 'تم قراءة الإشعار',
        notification
    });
});

/**
 * قراءة جميع الإشعارات
 */
exports.markAllAsRead = catchAsync(async (req, res, next) => {
    await notificationService.markAllAsRead(req.user.id);

    res.status(200).json({
        success: true,
        message: 'تم قراءة جميع الإشعارات'
    });
});

/**
 * الحصول على VAPID Public Key (مجاني تماماً)
 */
exports.getVAPIDPublicKey = catchAsync(async (req, res, next) => {
    const config = require('../config/env');
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../.env');
    
    let publicKey = config.vapidPublicKey;
    
    // إذا لم تكن موجودة، قم بتوليدها وحفظها
    if (!publicKey) {
        const { generateWebPushVAPIDKeys } = require('../utils/vapidKeys');
        const keys = generateWebPushVAPIDKeys();
        
        publicKey = keys.publicKey;
        const privateKey = keys.privateKey;
        
        // حفظ في ملف .env
        try {
            let envContent = '';
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }
            
            // إضافة أو تحديث VAPID keys
            if (envContent.includes('VAPID_PUBLIC_KEY')) {
                envContent = envContent.replace(/VAPID_PUBLIC_KEY=.*/g, `VAPID_PUBLIC_KEY=${publicKey}`);
                envContent = envContent.replace(/VAPID_PRIVATE_KEY=.*/g, `VAPID_PRIVATE_KEY=${privateKey}`);
            } else {
                envContent += `\n# VAPID Keys for Push Notifications (Generated automatically)\n`;
                envContent += `VAPID_PUBLIC_KEY=${publicKey}\n`;
                envContent += `VAPID_PRIVATE_KEY=${privateKey}\n`;
                envContent += `VAPID_EMAIL=${config.vapidEmail}\n`;
            }
            
            fs.writeFileSync(envPath, envContent);
            console.log('✅ VAPID keys generated and saved to .env');
        } catch (error) {
            console.warn('⚠️ Could not save VAPID keys to .env:', error.message);
            // سنستخدمها في الذاكرة فقط
        }
    }

    res.status(200).json({
        success: true,
        publicKey: publicKey
    });
});

/**
 * الاشتراك في Push Notifications
 */
exports.subscribe = catchAsync(async (req, res, next) => {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
        return next(new AppError('بيانات الاشتراك غير صحيحة', 400));
    }

    // حفظ الاشتراك في قاعدة البيانات
    await notificationService.saveSubscription(req.user.id, subscription);

    res.status(200).json({
        success: true,
        message: 'تم الاشتراك في الإشعارات بنجاح'
    });
});

/**
 * إلغاء الاشتراك من Push Notifications
 */
exports.unsubscribe = catchAsync(async (req, res, next) => {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
        return next(new AppError('بيانات الاشتراك غير صحيحة', 400));
    }

    // حذف الاشتراك من قاعدة البيانات
    await notificationService.removeSubscription(req.user.id, subscription);

    res.status(200).json({
        success: true,
        message: 'تم إلغاء الاشتراك من الإشعارات'
    });
});

/**
 * إرسال إشعار جماعي (للمشرفين فقط)
 */
exports.sendBulkNotification = catchAsync(async (req, res, next) => {
    // التحقق من أن المستخدم هو admin
    if (req.user.role !== 'admin') {
        return next(new AppError('غير مصرح لك بإرسال إشعارات جماعية', 403));
    }

    const { title, message, audience, type, priority } = req.body;

    if (!title || !message) {
        return next(new AppError('العنوان والرسالة مطلوبان', 400));
    }

    const result = await notificationService.sendBulkNotification(title, message, {
        audience: audience || 'all',
        type: type || 'system_announcement',
        priority: priority || 'normal'
    });

    if (!result.success) {
        return next(new AppError(result.error || 'فشل إرسال الإشعارات', 500));
    }

    res.status(200).json({
        success: true,
        message: `تم إرسال الإشعار إلى ${result.sent} مستخدم`,
        data: result
    });
});










