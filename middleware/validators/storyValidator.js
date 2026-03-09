/**
 * Story Validation Rules
 * قواعد التحقق من صحة بيانات الحالات والإعلانات
 */

const { body, param } = require('express-validator');

/**
 * Validation rules لإنشاء حالة/إعلان جديد
 */
exports.createStory = [
    body('type')
        .optional()
        .isIn(['story', 'ad'])
        .withMessage('نوع المحتوى يجب أن يكون story أو ad'),
    
    body('media.type')
        .notEmpty()
        .withMessage('نوع الوسائط مطلوب')
        .isIn(['image', 'video'])
        .withMessage('نوع الوسائط يجب أن يكون image أو video'),
    
    body('media.url')
        .notEmpty()
        .withMessage('رابط الوسائط مطلوب')
        .custom((val) => {
            if (typeof val !== 'string') return false;
            if (val.startsWith('/')) return true;
            try { new URL(val); return true; } catch (_) { return false; }
        })
        .withMessage('رابط الوسائط يجب أن يكون رابطاً صحيحاً أو مساراً يبدأ بـ /'),
    
    body('media.thumbnail')
        .optional()
        .isURL()
        .withMessage('رابط الصورة المصغرة يجب أن يكون URL صحيح'),
    
    body('caption')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('النص لا يمكن أن يكون أطول من 1000 حرف'),
    
    body('position')
        .optional()
        .isIn(['banner', 'popup', 'sidebar', 'story'])
        .withMessage('الموقع غير صحيح'),
    
    body('link')
        .optional()
        .isURL()
        .withMessage('الرابط يجب أن يكون URL صحيح'),
    
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ البدء غير صحيح'),
    
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ النهاية غير صحيح')
];

/**
 * Validation rules لتحديث حالة/إعلان
 */
exports.updateStory = [
    param('id')
        .isMongoId()
        .withMessage('معرف الحالة/الإعلان غير صحيح'),
    
    body('media.type')
        .optional()
        .isIn(['image', 'video'])
        .withMessage('نوع الوسائط يجب أن يكون image أو video'),
    
    body('media.url')
        .optional()
        .isURL()
        .withMessage('رابط الوسائط يجب أن يكون URL صحيح'),
    
    body('caption')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('النص لا يمكن أن يكون أطول من 1000 حرف'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'expired'])
        .withMessage('الحالة غير صحيحة')
];

/**
 * Validation rules لإضافة تعليق
 */
exports.addComment = [
    param('id')
        .isMongoId()
        .withMessage('معرف الحالة/الإعلان غير صحيح'),
    
    body('text')
        .trim()
        .notEmpty()
        .withMessage('نص التعليق مطلوب')
        .isLength({ min: 1, max: 500 })
        .withMessage('التعليق يجب أن يكون بين 1 و 500 حرف')
];









