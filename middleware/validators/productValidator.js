/**
 * Product Validation Rules
 * قواعد التحقق من صحة بيانات المنتجات
 */

const { body, param, query } = require('express-validator');

/**
 * Validation rules لإنشاء منتج جديد
 */
exports.createProduct = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('اسم المنتج مطلوب')
        .isLength({ min: 3, max: 100 })
        .withMessage('اسم المنتج يجب أن يكون بين 3 و 100 حرف'),
    
    body('category')
        .trim()
        .notEmpty()
        .withMessage('فئة المنتج مطلوبة')
        .isIn(['honey-sidr', 'honey-sumra', 'therapeutic-mix', 'bee-products', 'royal-jelly', 'pollen', 'propolis', 'oils', 'other'])
        .withMessage('فئة المنتج غير صحيحة'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('الوصف يجب أن يكون أقل من 1000 حرف'),
    
    body('price')
        .notEmpty()
        .withMessage('السعر مطلوب')
        .isFloat({ min: 0 })
        .withMessage('السعر يجب أن يكون رقماً موجباً'),
    
    body('oldPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('السعر القديم يجب أن يكون رقماً موجباً'),
    
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('المخزون يجب أن يكون رقماً صحيحاً موجباً'),
    
    body('minOrder')
        .optional()
        .isInt({ min: 1 })
        .withMessage('الحد الأدنى للطلب يجب أن يكون رقماً صحيحاً أكبر من أو يساوي 1'),
    
    body('sku')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('رمز المنتج يجب أن يكون بين 3 و 50 حرف'),
    
    body('featured')
        .optional()
        .isBoolean()
        .withMessage('حقل المميز يجب أن يكون true أو false'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'draft'])
        .withMessage('حالة المنتج غير صحيحة')
];

/**
 * Validation rules لتحديث منتج
 */
exports.updateProduct = [
    param('id')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح'),
    
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('اسم المنتج يجب أن يكون بين 3 و 100 حرف'),
    
    body('category')
        .optional()
        .trim()
        .isIn(['honey-sidr', 'honey-sumra', 'therapeutic-mix', 'bee-products', 'royal-jelly', 'pollen', 'propolis', 'oils', 'other'])
        .withMessage('فئة المنتج غير صحيحة'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('الوصف يجب أن يكون أقل من 1000 حرف'),
    
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('السعر يجب أن يكون رقماً موجباً'),
    
    body('oldPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('السعر القديم يجب أن يكون رقماً موجباً'),
    
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('المخزون يجب أن يكون رقماً صحيحاً موجباً'),
    
    body('minOrder')
        .optional()
        .isInt({ min: 1 })
        .withMessage('الحد الأدنى للطلب يجب أن يكون رقماً صحيحاً أكبر من أو يساوي 1'),
    
    body('featured')
        .optional()
        .isBoolean()
        .withMessage('حقل المميز يجب أن يكون true أو false'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'draft'])
        .withMessage('حالة المنتج غير صحيحة')
];

/**
 * Validation rules للحصول على منتج
 */
exports.getProduct = [
    param('id')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح')
];

/**
 * Validation rules للبحث والفلترة
 */
exports.searchProducts = [
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('نص البحث يجب أن يكون بين 1 و 100 حرف'),
    
    query('category')
        .optional()
        .trim()
        .isIn(['honey-sidr', 'honey-sumra', 'therapeutic-mix', 'bee-products', 'royal-jelly', 'pollen', 'propolis', 'oils', 'other'])
        .withMessage('فئة المنتج غير صحيحة'),
    
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('الحد الأدنى للسعر يجب أن يكون رقماً موجباً'),
    
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('الحد الأقصى للسعر يجب أن يكون رقماً موجباً'),
    
    query('featured')
        .optional()
        .isBoolean()
        .withMessage('حقل المميز يجب أن يكون true أو false'),
    
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
        .isIn(['price-asc', 'price-desc', 'name-asc', 'name-desc', 'created-desc', 'created-asc'])
        .withMessage('نوع الترتيب غير صحيح')
];

/**
 * Validation rules لحذف منتج
 */
exports.deleteProduct = [
    param('id')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح')
];




















