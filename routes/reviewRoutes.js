/**
 * Review Routes
 * Routes لإدارة التقييمات
 */

const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const createReviewValidation = [
    body('rating')
        .notEmpty()
        .withMessage('التقييم مطلوب')
        .isInt({ min: 1, max: 5 })
        .withMessage('التقييم يجب أن يكون بين 1 و 5'),
    body('title')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('العنوان يجب أن يكون أقل من 100 حرف'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('التعليق يجب أن يكون أقل من 1000 حرف')
];

// Public routes
router.get('/product/:productId', 
    param('productId').isMongoId().withMessage('معرف المنتج غير صحيح'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('rating').optional().isInt({ min: 1, max: 5 }),
    validate,
    reviewController.getProductReviews
);

// Protected routes (require authentication)
router.post('/product/:productId',
    authenticateToken,
    param('productId').isMongoId().withMessage('معرف المنتج غير صحيح'),
    createReviewValidation,
    validate,
    reviewController.createReview
);

router.put('/:reviewId',
    authenticateToken,
    param('reviewId').isMongoId().withMessage('معرف التقييم غير صحيح'),
    createReviewValidation,
    validate,
    reviewController.updateReview
);

router.delete('/:reviewId',
    authenticateToken,
    param('reviewId').isMongoId().withMessage('معرف التقييم غير صحيح'),
    validate,
    reviewController.deleteReview
);

router.post('/:reviewId/helpful',
    authenticateToken,
    param('reviewId').isMongoId().withMessage('معرف التقييم غير صحيح'),
    validate,
    reviewController.markHelpful
);

router.post('/:reviewId/not-helpful',
    authenticateToken,
    param('reviewId').isMongoId().withMessage('معرف التقييم غير صحيح'),
    validate,
    reviewController.markNotHelpful
);

// Admin routes
router.post('/:reviewId/approve',
    authenticateToken,
    requireAdmin,
    param('reviewId').isMongoId().withMessage('معرف التقييم غير صحيح'),
    validate,
    reviewController.approveReview
);

router.post('/:reviewId/reject',
    authenticateToken,
    requireAdmin,
    param('reviewId').isMongoId().withMessage('معرف التقييم غير صحيح'),
    validate,
    reviewController.rejectReview
);

module.exports = router;




















