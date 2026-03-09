/**
 * Analytics Controller
 * Controller للتحليلات والإحصائيات
 */

const Analytics = require('../models/Analytics');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * تسجيل حدث تحليلي
 */
exports.trackEvent = catchAsync(async (req, res, next) => {
    const {
        eventType,
        productId,
        orderId,
        searchQuery,
        filters,
        value,
        metadata
    } = req.body;
    
    // الحصول على sessionId من headers أو إنشاء واحد جديد
    const sessionId = req.headers['x-session-id'] || req.sessionID || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // الحصول على userId إذا كان المستخدم مسجل دخول
    let userId = null;
    if (req.user) {
        const Customer = require('../models/Customer');
        const customer = await Customer.findOne({ user: req.user.id });
        if (customer) {
            userId = customer._id;
        }
    }
    
    // معلومات الجهاز والموقع
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip || req.connection.remoteAddress;
    
    // إنشاء الحدث
    const event = await Analytics.create({
        eventType,
        userId,
        sessionId,
        product: productId,
        order: orderId,
        searchQuery,
        filters,
        value,
        currency: 'SAR',
        metadata: metadata || {},
        userAgent,
        ip,
        timestamp: new Date()
    });
    
    res.status(201).json({
        success: true,
        event
    });
});

/**
 * الحصول على إحصائيات الأحداث
 */
exports.getEventStats = catchAsync(async (req, res, next) => {
    const { eventType, startDate, endDate } = req.query;
    
    if (!eventType) {
        return next(new AppError('نوع الحدث مطلوب', 400));
    }
    
    const stats = await Analytics.getEventStats(eventType, startDate, endDate);
    
    res.status(200).json({
        success: true,
        eventType,
        stats: stats[0] || { count: 0, totalValue: 0, avgValue: 0 }
    });
});

/**
 * الحصول على قمع التحويل
 */
exports.getConversionFunnel = catchAsync(async (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    const funnel = await Analytics.getConversionFunnel(startDate, endDate);
    
    res.status(200).json({
        success: true,
        funnel
    });
});

/**
 * الحصول على المنتجات الأكثر مشاهدة
 */
exports.getTopViewedProducts = catchAsync(async (req, res, next) => {
    const { limit = 10, startDate, endDate } = req.query;
    
    const products = await Analytics.getTopViewedProducts(
        parseInt(limit),
        startDate,
        endDate
    );
    
    // ملء معلومات المنتجات
    const Product = require('../models/Product');
    const productIds = products.map(p => p.product);
    const productDetails = await Product.find({ _id: { $in: productIds } })
        .select('name image price');
    
    const productsWithDetails = products.map(p => {
        const product = productDetails.find(prod => prod._id.toString() === p.product.toString());
        return {
            ...p,
            productDetails: product
        };
    });
    
    res.status(200).json({
        success: true,
        products: productsWithDetails
    });
});

/**
 * الحصول على إحصائيات المبيعات
 */
exports.getSalesStats = catchAsync(async (req, res, next) => {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const match = {
        eventType: 'purchase'
    };
    
    if (startDate || endDate) {
        match.timestamp = {};
        if (startDate) match.timestamp.$gte = new Date(startDate);
        if (endDate) match.timestamp.$lte = new Date(endDate);
    }
    
    let groupFormat;
    switch (groupBy) {
        case 'hour':
            groupFormat = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' },
                hour: { $hour: '$timestamp' }
            };
            break;
        case 'day':
            groupFormat = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' }
            };
            break;
        case 'week':
            groupFormat = {
                year: { $year: '$timestamp' },
                week: { $week: '$timestamp' }
            };
            break;
        case 'month':
            groupFormat = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' }
            };
            break;
        default:
            groupFormat = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' }
            };
    }
    
    const stats = await Analytics.aggregate([
        { $match: match },
        {
            $group: {
                _id: groupFormat,
                count: { $sum: 1 },
                totalValue: { $sum: '$value' },
                avgValue: { $avg: '$value' }
            }
        },
        { $sort: { '_id': 1 } }
    ]);
    
    res.status(200).json({
        success: true,
        stats,
        groupBy
    });
});

/**
 * الحصول على أحداث المستخدم
 */
exports.getUserEvents = catchAsync(async (req, res, next) => {
    const { limit = 50 } = req.query;
    
    const Customer = require('../models/Customer');
    const customer = await Customer.findOne({ user: req.user.id });
    
    if (!customer) {
        return next(new AppError('العميل غير موجود', 404));
    }
    
    const events = await Analytics.getUserEvents(customer._id, parseInt(limit));
    
    res.status(200).json({
        success: true,
        events
    });
});




















