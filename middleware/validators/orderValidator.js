/**
 * Order Validation Rules
 * قواعد التحقق من صحة بيانات الطلبات
 */

const { body, param, query } = require('express-validator');

/**
 * Validation rules لإنشاء طلب جديد
 */
exports.createOrder = [
    body('orderId')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('رقم الطلب يجب أن يكون بين 3 و 50 حرف'),
    
    body('customer.name')
        .trim()
        .notEmpty()
        .withMessage('اسم العميل مطلوب')
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم العميل يجب أن يكون بين 2 و 100 حرف'),
    
    body('customer.phone')
        .trim()
        .notEmpty()
        .withMessage('رقم الهاتف مطلوب')
        .matches(/^[0-9+\-\s()]+$/)
        .withMessage('رقم الهاتف غير صحيح'),
    
    body('customer.city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('اسم المدينة يجب أن يكون بين 2 و 50 حرف'),
    
    body('customer.address')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('العنوان يجب أن يكون أقل من 200 حرف'),
    
    body('customer.notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('الملاحظات يجب أن تكون أقل من 500 حرف'),
    
    body('items')
        .isArray({ min: 1 })
        .withMessage('يجب أن يحتوي الطلب على منتج واحد على الأقل'),
    
    body('items.*.product')
        .notEmpty()
        .withMessage('معرف المنتج مطلوب')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح'),
    
    body('items.*.quantity')
        .notEmpty()
        .withMessage('الكمية مطلوبة')
        .isInt({ min: 1 })
        .withMessage('الكمية يجب أن تكون رقماً صحيحاً أكبر من 0'),
    
    body('items.*.price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('السعر يجب أن يكون رقماً موجباً'),
    
    body('total')
        .notEmpty()
        .withMessage('المجموع الكلي مطلوب')
        .isFloat({ min: 0 })
        .withMessage('المجموع الكلي يجب أن يكون رقماً موجباً'),
    
    body('shipping')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('رسوم الشحن يجب أن تكون رقماً موجباً'),
    
    body('paymentMethod')
        .optional()
        .trim()
        .isIn(['delivery', 'half', 'full', 'cash_on_delivery', 'credit_card', 'bank_transfer', 'paypal'])
        .withMessage('طريقة الدفع غير صحيحة'),

    body('currency')
        .optional()
        .isIn(['YER', 'SAR'])
        .withMessage('العملة غير صالحة')
];

/**
 * Validation rules لتحديث طلب
 */
exports.updateOrder = [
    param('id')
        .isMongoId()
        .withMessage('معرف الطلب غير صحيح'),
    
    body('status')
        .optional()
        .trim()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('حالة الطلب غير صحيحة'),
    
    body('customer.name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم العميل يجب أن يكون بين 2 و 100 حرف'),
    
    body('customer.phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-\s()]+$/)
        .withMessage('رقم الهاتف غير صحيح'),
    
    body('customer.address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('العنوان يجب أن يكون بين 5 و 200 حرف')
];

/**
 * Validation rules للحصول على طلب
 */
exports.getOrder = [
    param('id')
        .isMongoId()
        .withMessage('معرف الطلب غير صحيح')
];

/**
 * Validation rules للبحث والفلترة
 */
exports.getOrders = [
    query('status')
        .optional()
        .trim()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('حالة الطلب غير صحيحة'),
    
    query('customerId')
        .optional()
        .isMongoId()
        .withMessage('معرف العميل غير صحيح'),
    
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ البداية غير صحيح'),
    
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('تاريخ النهاية غير صحيح'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقماً صحيحاً أكبر من 0'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('عدد العناصر يجب أن يكون بين 1 و 100'),
    
    query('sort')
        .optional()
        .isIn(['created-desc', 'created-asc', 'total-desc', 'total-asc'])
        .withMessage('نوع الترتيب غير صحيح')
];

/**
 * Validation rules لإلغاء طلب
 */
exports.cancelOrder = [
    param('id')
        .isMongoId()
        .withMessage('معرف الطلب غير صحيح'),
    
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('سبب الإلغاء يجب أن يكون أقل من 500 حرف')
];















