/**
 * Contest Validation Rules
 * قواعد التحقق من صحة بيانات المسابقات
 */

const { body, param } = require('express-validator');

/**
 * Validation rules لإنشاء مسابقة جديدة
 */
exports.createContest = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('اسم المسابقة مطلوب')
        .isLength({ min: 3, max: 100 })
        .withMessage('اسم المسابقة يجب أن يكون بين 3 و 100 حرف'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('الوصف يجب أن يكون أقل من 1000 حرف'),
    
    body('prize')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('الجائزة يجب أن تكون أقل من 200 حرف'),
    
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ البداية غير صحيح')
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('تاريخ البداية يجب أن يكون في المستقبل');
            }
            return true;
        }),
    
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ النهاية غير صحيح')
        .custom((value, { req }) => {
            if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
            }
            return true;
        }),
    
    body('status')
        .optional()
        .trim()
        .isIn(['active', 'inactive', 'completed'])
        .withMessage('حالة المسابقة غير صحيحة')
];

/**
 * Validation rules لتحديث مسابقة
 */
exports.updateContest = [
    param('id')
        .isMongoId()
        .withMessage('معرف المسابقة غير صحيح'),
    
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('اسم المسابقة يجب أن يكون بين 3 و 100 حرف'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('الوصف يجب أن يكون أقل من 1000 حرف'),
    
    body('prize')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('الجائزة يجب أن تكون أقل من 200 حرف'),
    
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ البداية غير صحيح'),
    
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ النهاية غير صحيح'),
    
    body('status')
        .optional()
        .trim()
        .isIn(['active', 'inactive', 'completed'])
        .withMessage('حالة المسابقة غير صحيحة')
];

/**
 * Validation rules للحصول على مسابقة
 */
exports.getContest = [
    param('id')
        .isMongoId()
        .withMessage('معرف المسابقة غير صحيح')
];

/**
 * Validation rules لإضافة مشارك
 */
exports.addParticipant = [
    param('id')
        .isMongoId()
        .withMessage('معرف المسابقة غير صحيح'),
    
    body('participant')
        .trim()
        .notEmpty()
        .withMessage('اسم المشارك مطلوب')
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم المشارك يجب أن يكون بين 2 و 100 حرف')
];




















