/**
 * Review Controller
 * Controller لإدارة التقييمات
 */

const Review = require('../models/Review');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * الحصول على تقييمات منتج
 */
exports.getProductReviews = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating, sort = 'helpful-desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = {
        product: productId,
        status: 'approved'
    };
    
    if (rating) {
        query.rating = parseInt(rating);
    }
    
    let sortOption = { createdAt: -1 };
    if (sort === 'helpful-desc') {
        sortOption = { helpful: -1, createdAt: -1 };
    } else if (sort === 'rating-desc') {
        sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'rating-asc') {
        sortOption = { rating: 1, createdAt: -1 };
    }
    
    const reviews = await Review.find(query)
        .populate('customer', 'profile email')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit));
    
    const total = await Review.countDocuments(query);
    
    // الحصول على إحصائيات التقييمات
    const ratingStats = await Review.aggregate([
        { $match: { product: require('mongoose').Types.ObjectId(productId), status: 'approved' } },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 }
            }
        }
    ]);
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach(stat => {
        distribution[stat._id] = stat.count;
    });
    
    res.status(200).json({
        success: true,
        reviews,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        },
        distribution
    });
});

/**
 * إنشاء تقييم جديد
 */
exports.createReview = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const { rating, title, comment, images, orderId } = req.body;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    // التحقق من وجود المنتج
    const product = await Product.findById(productId);
    
    if (!product) {
        return next(new AppError('المنتج غير موجود', 404));
    }
    
    // التحقق من عدم وجود تقييم سابق
    const existingReview = await Review.findOne({
        product: productId,
        customer: customer._id
    });
    
    if (existingReview) {
        return next(new AppError('لديك تقييم سابق لهذا المنتج', 400));
    }
    
    // إنشاء التقييم
    const review = await Review.create({
        product: productId,
        customer: customer._id,
        order: orderId,
        rating,
        title,
        comment,
        images: images || [],
        verifiedPurchase: !!orderId
    });
    
    await review.populate('customer', 'profile email');
    
    res.status(201).json({
        success: true,
        message: 'تم إضافة التقييم بنجاح',
        review
    });
});

/**
 * تحديث تقييم
 */
exports.updateReview = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    const review = await Review.findOne({
        _id: reviewId,
        customer: customer._id
    });
    
    if (!review) {
        return next(new AppError('التقييم غير موجود', 404));
    }
    
    if (review.status === 'approved') {
        return next(new AppError('لا يمكن تعديل تقييم تمت الموافقة عليه', 400));
    }
    
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (images) review.images = images;
    
    await review.save();
    await review.populate('customer', 'profile email');
    
    res.status(200).json({
        success: true,
        message: 'تم تحديث التقييم بنجاح',
        review
    });
});

/**
 * حذف تقييم
 */
exports.deleteReview = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    const review = await Review.findOne({
        _id: reviewId,
        customer: customer._id
    });
    
    if (!review) {
        return next(new AppError('التقييم غير موجود', 404));
    }
    
    await review.deleteOne();
    
    res.status(200).json({
        success: true,
        message: 'تم حذف التقييم بنجاح'
    });
});

/**
 * إضافة تقييم مفيد
 */
exports.markHelpful = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
        return next(new AppError('التقييم غير موجود', 404));
    }
    
    await review.markHelpful(customer._id);
    
    res.status(200).json({
        success: true,
        message: 'تم إضافة التقييم كـ مفيد',
        helpful: review.helpful,
        notHelpful: review.notHelpful ?? 0
    });
});

/**
 * إضافة تقييم غير مفيد
 */
exports.markNotHelpful = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
        return next(new AppError('التقييم غير موجود', 404));
    }
    
    await review.markNotHelpful(customer._id);
    
    res.status(200).json({
        success: true,
        message: 'تم إضافة التقييم كـ غير مفيد',
        helpful: review.helpful,
        notHelpful: review.notHelpful ?? 0
    });
});

/**
 * الموافقة على تقييم (للمشرف)
 */
exports.approveReview = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
        return next(new AppError('التقييم غير موجود', 404));
    }
    
    await review.approve();
    
    res.status(200).json({
        success: true,
        message: 'تمت الموافقة على التقييم',
        review
    });
});

/**
 * رفض تقييم (للمشرف)
 */
exports.rejectReview = catchAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
        return next(new AppError('التقييم غير موجود', 404));
    }
    
    await review.reject();
    
    res.status(200).json({
        success: true,
        message: 'تم رفض التقييم',
        review
    });
});




















