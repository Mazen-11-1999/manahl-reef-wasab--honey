/**
 * Health Info Routes
 * Routes لإدارة المعلومات الطبية - صيدلية ريف وصاب الطبيعية
 */

const express = require('express');
const healthInfoController = require('../controllers/healthInfoController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const createHealthInfoValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('العنوان مطلوب')
        .isLength({ min: 3, max: 200 })
        .withMessage('العنوان يجب أن يكون بين 3 و 200 حرف'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('الوصف مطلوب')
        .isLength({ min: 10, max: 2000 })
        .withMessage('الوصف يجب أن يكون بين 10 و 2000 حرف'),
    body('healthCategory')
        .optional()
        .isIn(['immunity', 'digestion', 'energy', 'skin', 'heart', 'diabetes', 'blood_pressure', 'respiratory', 'brain', 'bones', 'other'])
        .withMessage('الفئة الصحية غير صحيحة'),
    body('product')
        .optional()
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح'),
    body('priority')
        .optional()
        .isIn(['high', 'medium', 'low'])
        .withMessage('الأولوية غير صحيحة'),
    body('contentType')
        .optional()
        .isIn(['benefit', 'recipe', 'usage_tip', 'study', 'warning'])
        .withMessage('نوع المحتوى غير صحيح')
];

const updateHealthInfoValidation = [
    param('id')
        .isMongoId()
        .withMessage('معرف المعلومة الطبية غير صحيح'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('العنوان يجب أن يكون بين 3 و 200 حرف'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('الوصف يجب أن يكون بين 10 و 2000 حرف')
];

// Public routes
router.get('/', healthInfoController.getHealthInfos);
router.get('/stats', healthInfoController.getHealthInfoStats);
router.get('/:id', healthInfoController.getHealthInfo);
router.post('/:id/like', healthInfoController.likeHealthInfo);

// Protected routes (require authentication)
router.use(authenticateToken);

// Admin routes
router.post('/',
    requireAdmin,
    createHealthInfoValidation,
    validate,
    healthInfoController.createHealthInfo
);

router.put('/:id',
    requireAdmin,
    updateHealthInfoValidation,
    validate,
    healthInfoController.updateHealthInfo
);

router.delete('/:id',
    requireAdmin,
    param('id').isMongoId().withMessage('معرف المعلومة الطبية غير صحيح'),
    validate,
    healthInfoController.deleteHealthInfo
);

module.exports = router;







