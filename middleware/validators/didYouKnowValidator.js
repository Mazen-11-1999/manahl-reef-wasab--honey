/**
 * Did You Know Validation Rules
 * قواعد التحقق من صحة بيانات "هل تعلم؟"
 */

const { body, param } = require('express-validator');

/**
 * Validation rules لإنشاء عنصر جديد
 */
exports.createDidYouKnow = [
    body('text')
        .trim()
        .notEmpty()
        .withMessage('النص مطلوب')
        .isLength({ min: 10, max: 500 })
        .withMessage('النص يجب أن يكون بين 10 و 500 حرف'),
    
    body('active')
        .optional()
        .isBoolean()
        .withMessage('حقل النشاط يجب أن يكون true أو false')
];

/**
 * Validation rules لتحديث عنصر
 */
exports.updateDidYouKnow = [
    param('id')
        .isMongoId()
        .withMessage('معرف العنصر غير صحيح'),
    
    body('text')
        .optional()
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('النص يجب أن يكون بين 10 و 500 حرف'),
    
    body('active')
        .optional()
        .isBoolean()
        .withMessage('حقل النشاط يجب أن يكون true أو false')
];

/**
 * Validation rules للحصول على عنصر
 */
exports.getDidYouKnow = [
    param('id')
        .isMongoId()
        .withMessage('معرف العنصر غير صحيح')
];




















