/**
 * Health Info Controller
 * Controller لإدارة المعلومات الطبية - صيدلية ريف وصاب الطبيعية
 */

const HealthInfo = require('../models/HealthInfo');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * الحصول على جميع المعلومات الطبية
 */
exports.getHealthInfos = catchAsync(async (req, res, next) => {
    const { 
        healthCategory, 
        healthCondition, 
        product, 
        contentType,
        priority,
        active,
        search,
        page = 1, 
        limit = 20,
        sort = '-createdAt'
    } = req.query;

    // بناء query
    const query = {};

    if (healthCategory) {
        query.healthCategory = healthCategory;
    }

    if (healthCondition) {
        query.healthCondition = { $regex: healthCondition, $options: 'i' };
    }

    if (product) {
        query.product = product;
    }

    if (contentType) {
        query.contentType = contentType;
    }

    if (priority) {
        query.priority = priority;
    }

    if (active !== undefined) {
        query.active = active === 'true';
    }

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { healthCondition: { $regex: search, $options: 'i' } }
        ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // الحصول على المعلومات
    const healthInfos = await HealthInfo.find(query)
        .populate('product', 'name image price')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

    // العدد الإجمالي
    const total = await HealthInfo.countDocuments(query);

    res.status(200).json({
        success: true,
        count: healthInfos.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        items: healthInfos
    });
});

/**
 * الحصول على معلومة طبية واحدة
 */
exports.getHealthInfo = catchAsync(async (req, res, next) => {
    const healthInfo = await HealthInfo.findById(req.params.id)
        .populate('product', 'name image price category');

    if (!healthInfo) {
        return next(new AppError('المعلومة الطبية غير موجودة', 404));
    }

    // زيادة عدد المشاهدات
    await healthInfo.incrementViews();

    res.status(200).json({
        success: true,
        item: healthInfo
    });
});

/**
 * إنشاء معلومة طبية جديدة
 */
exports.createHealthInfo = catchAsync(async (req, res, next) => {
    const {
        title,
        description,
        healthCategory,
        healthCondition,
        product,
        benefits,
        usageInstructions,
        dosage,
        bestTimes,
        warnings,
        drugInteractions,
        scientificSource,
        studyLink,
        image,
        icon,
        priority,
        active,
        contentType,
        recipe
    } = req.body;

    // التحقق من المنتج إذا كان موجوداً
    if (product) {
        const Product = require('../models/Product');
        const productDoc = await Product.findById(product);
        if (!productDoc) {
            return next(new AppError('المنتج غير موجود', 404));
        }
    }

    const healthInfo = new HealthInfo({
        title,
        description,
        healthCategory: healthCategory || 'other',
        healthCondition,
        product,
        benefits: Array.isArray(benefits) ? benefits : [],
        usageInstructions,
        dosage,
        bestTimes: Array.isArray(bestTimes) ? bestTimes : [],
        warnings,
        drugInteractions,
        scientificSource,
        studyLink,
        image,
        icon: icon || '🏥',
        priority: priority || 'medium',
        active: active !== undefined ? active : true,
        contentType: contentType || 'benefit',
        recipe: recipe || {}
    });

    await healthInfo.save();

    res.status(201).json({
        success: true,
        message: 'تم إنشاء المعلومة الطبية بنجاح',
        item: healthInfo
    });
});

/**
 * تحديث معلومة طبية
 */
exports.updateHealthInfo = catchAsync(async (req, res, next) => {
    const healthInfo = await HealthInfo.findById(req.params.id);

    if (!healthInfo) {
        return next(new AppError('المعلومة الطبية غير موجودة', 404));
    }

    // التحقق من المنتج إذا كان موجوداً
    if (req.body.product) {
        const Product = require('../models/Product');
        const productDoc = await Product.findById(req.body.product);
        if (!productDoc) {
            return next(new AppError('المنتج غير موجود', 404));
        }
    }

    // تحديث الحقول
    Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
            healthInfo[key] = req.body[key];
        }
    });

    healthInfo.updatedAt = new Date();
    await healthInfo.save();

    res.status(200).json({
        success: true,
        message: 'تم تحديث المعلومة الطبية بنجاح',
        item: healthInfo
    });
});

/**
 * حذف معلومة طبية
 */
exports.deleteHealthInfo = catchAsync(async (req, res, next) => {
    const healthInfo = await HealthInfo.findById(req.params.id);

    if (!healthInfo) {
        return next(new AppError('المعلومة الطبية غير موجودة', 404));
    }

    await healthInfo.deleteOne();

    res.status(200).json({
        success: true,
        message: 'تم حذف المعلومة الطبية بنجاح'
    });
});

/**
 * الحصول على إحصائيات المعلومات الطبية
 */
exports.getHealthInfoStats = catchAsync(async (req, res, next) => {
    const total = await HealthInfo.countDocuments();
    const active = await HealthInfo.countDocuments({ active: true });
    const inactive = await HealthInfo.countDocuments({ active: false });

    // حسب الفئة
    const byCategory = await HealthInfo.aggregate([
        {
            $group: {
                _id: '$healthCategory',
                count: { $sum: 1 }
            }
        }
    ]);

    // حسب نوع المحتوى
    const byContentType = await HealthInfo.aggregate([
        {
            $group: {
                _id: '$contentType',
                count: { $sum: 1 }
            }
        }
    ]);

    // حسب الأولوية
    const byPriority = await HealthInfo.aggregate([
        {
            $group: {
                _id: '$priority',
                count: { $sum: 1 }
            }
        }
    ]);

    // إجمالي المشاهدات
    const totalViews = await HealthInfo.aggregate([
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$views' }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        stats: {
            total,
            active,
            inactive,
            byCategory,
            byContentType,
            byPriority,
            totalViews: totalViews[0]?.totalViews || 0
        }
    });
});

/**
 * زيادة عدد الإعجابات
 */
exports.likeHealthInfo = catchAsync(async (req, res, next) => {
    const healthInfo = await HealthInfo.findById(req.params.id);

    if (!healthInfo) {
        return next(new AppError('المعلومة الطبية غير موجودة', 404));
    }

    await healthInfo.toggleLike();

    res.status(200).json({
        success: true,
        message: 'تم إضافة إعجاب',
        likes: healthInfo.likes
    });
});







