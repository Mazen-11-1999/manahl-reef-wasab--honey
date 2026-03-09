/**
 * Cart Routes
 * Routes لإدارة سلة التسوق
 */

const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Protected routes (require authentication)
router.use(authenticateToken);

// Validation rules
const addItemValidation = [
    body('productId')
        .notEmpty()
        .withMessage('معرف المنتج مطلوب')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح'),
    body('quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('الكمية يجب أن تكون رقماً صحيحاً أكبر من 0')
];

const updateItemValidation = [
    param('productId')
        .isMongoId()
        .withMessage('معرف المنتج غير صحيح'),
    body('quantity')
        .notEmpty()
        .withMessage('الكمية مطلوبة')
        .isInt({ min: 1 })
        .withMessage('الكمية يجب أن تكون رقماً صحيحاً أكبر من 0')
];

// Routes
router.get('/', cartController.getCart);
router.post('/add', addItemValidation, validate, cartController.addItem);
router.put('/update/:productId', updateItemValidation, validate, cartController.updateItem);
router.delete('/remove/:productId', cartController.removeItem);
router.delete('/clear', cartController.clearCart);

module.exports = router;













