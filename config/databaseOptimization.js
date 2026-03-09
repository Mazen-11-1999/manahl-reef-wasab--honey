/**
 * Database Optimization
 * تحسينات قاعدة البيانات - Indexes و Aggregation Pipelines
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * إنشاء Indexes محسنة لجميع النماذج
 */
const createIndexes = async () => {
    try {
        // التحقق من حالة الاتصال أولاً
        if (mongoose.connection.readyState !== 1) {
            logger.warn('⚠️  قاعدة البيانات غير متصلة - تم تخطي إنشاء Indexes');
            return;
        }
        
        // محاولة تحميل النماذج بشكل آمن
        let Product, Order, Customer, Cart, Review, Payment, Analytics;
        try {
            Product = mongoose.model('Product');
            Order = mongoose.model('Order');
            Customer = mongoose.model('Customer');
            Cart = mongoose.model('Cart');
            Review = mongoose.model('Review');
            Payment = mongoose.model('Payment');
            Analytics = mongoose.model('Analytics');
        } catch (modelError) {
            logger.warn('⚠️  بعض النماذج غير متاحة:', modelError.message);
            return;
        }

        // Product Indexes
        await Product.collection.createIndex({ name: 'text', description: 'text' });
        await Product.collection.createIndex({ category: 1, price: 1 });
        await Product.collection.createIndex({ featured: 1, status: 1 });
        await Product.collection.createIndex({ 'ratings.average': -1 });
        await Product.collection.createIndex({ createdAt: -1 });
        logger.info('✅ Product indexes created');

        // Order Indexes
        await Order.collection.createIndex({ orderId: 1 }, { unique: true });
        await Order.collection.createIndex({ 'customer.phone': 1 });
        await Order.collection.createIndex({ status: 1, createdAt: -1 });
        await Order.collection.createIndex({ total: -1 });
        logger.info('✅ Order indexes created');

        // Customer Indexes (if model exists)
        if (Customer) {
            await Customer.collection.createIndex({ email: 1 }, { unique: true });
            await Customer.collection.createIndex({ phone: 1 });
            await Customer.collection.createIndex({ 'loyalty.tier': 1 });
            await Customer.collection.createIndex({ createdAt: -1 });
            logger.info('✅ Customer indexes created');
        }

        // Cart Indexes (if model exists)
        if (Cart) {
            await Cart.collection.createIndex({ customer: 1 }, { unique: true });
            await Cart.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
            logger.info('✅ Cart indexes created');
        }

        // Review Indexes (if model exists)
        if (Review) {
            await Review.collection.createIndex({ product: 1, status: 1 });
            await Review.collection.createIndex({ customer: 1 });
            await Review.collection.createIndex({ rating: 1 });
            await Review.collection.createIndex({ helpful: -1 });
            await Review.collection.createIndex({ product: 1, customer: 1 }, { unique: true });
            logger.info('✅ Review indexes created');
        }

        // Payment Indexes (if model exists)
        if (Payment) {
            await Payment.collection.createIndex({ order: 1 });
            await Payment.collection.createIndex({ customer: 1 });
            await Payment.collection.createIndex({ status: 1 });
            await Payment.collection.createIndex({ transactionId: 1 });
            await Payment.collection.createIndex({ createdAt: -1 });
            logger.info('✅ Payment indexes created');
        }

        // Analytics Indexes (if model exists)
        if (Analytics) {
            await Analytics.collection.createIndex({ eventType: 1, timestamp: -1 });
            await Analytics.collection.createIndex({ userId: 1, timestamp: -1 });
            await Analytics.collection.createIndex({ sessionId: 1, timestamp: -1 });
            await Analytics.collection.createIndex({ product: 1, timestamp: -1 });
            await Analytics.collection.createIndex({ timestamp: -1 });
            logger.info('✅ Analytics indexes created');
        }

        logger.info('✅ All database indexes created successfully');
    } catch (error) {
        logger.error('❌ Error creating indexes:', error);
    }
};

/**
 * Aggregation Pipeline محسنة للمنتجات
 */
const getProductsAggregation = (filters = {}) => {
    const pipeline = [
        {
            $match: {
                status: { $ne: 'draft' },
                ...filters
            }
        },
        {
            $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'product',
                as: 'reviews'
            }
        },
        {
            $addFields: {
                reviewCount: { $size: '$reviews' },
                averageRating: {
                    $cond: {
                        if: { $gt: [{ $size: '$reviews' }, 0] },
                        then: { $avg: '$reviews.rating' },
                        else: 0
                    }
                }
            }
        },
        {
            $project: {
                reviews: 0 // إزالة reviews من النتيجة
            }
        }
    ];

    return pipeline;
};

/**
 * Aggregation Pipeline للمبيعات
 */
const getSalesAggregation = (startDate, endDate, groupBy = 'day') => {
    const matchStage = {
        $match: {
            status: { $in: ['completed', 'delivered'] }
        }
    };

    if (startDate || endDate) {
        matchStage.$match.createdAt = {};
        if (startDate) matchStage.$match.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.$match.createdAt.$lte = new Date(endDate);
    }

    let groupFormat;
    switch (groupBy) {
        case 'hour':
            groupFormat = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
                hour: { $hour: '$createdAt' }
            };
            break;
        case 'day':
            groupFormat = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            };
            break;
        case 'week':
            groupFormat = {
                year: { $year: '$createdAt' },
                week: { $week: '$createdAt' }
            };
            break;
        case 'month':
            groupFormat = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            };
            break;
        default:
            groupFormat = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            };
    }

    return [
        matchStage,
        {
            $group: {
                _id: groupFormat,
                totalSales: { $sum: '$total' },
                orderCount: { $sum: 1 },
                avgOrderValue: { $avg: '$total' }
            }
        },
        {
            $sort: { '_id': 1 }
        }
    ];
};

/**
 * Connection Pool Optimization
 */
const optimizeConnection = () => {
    const options = {
        maxPoolSize: 10, // الحفاظ على ما يصل إلى 10 اتصالات
        minPoolSize: 2, // الحفاظ على ما لا يقل عن 2 اتصالات
        maxIdleTimeMS: 30000, // إغلاق الاتصالات الخاملة بعد 30 ثانية
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
    };

    return options;
};

module.exports = {
    createIndexes,
    getProductsAggregation,
    getSalesAggregation,
    optimizeConnection
};













