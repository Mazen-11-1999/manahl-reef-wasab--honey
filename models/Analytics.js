/**
 * Analytics Model
 * نموذج التحليلات - مناحل ريف وصاب
 */

const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    country: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    region: {
        type: String,
        trim: true
    },
    coordinates: {
        latitude: Number,
        longitude: Number
    }
}, { _id: false });

const AnalyticsSchema = new mongoose.Schema({
    // نوع الحدث
    eventType: {
        type: String,
        required: [true, 'نوع الحدث مطلوب'],
        enum: [
            'page_view',
            'product_view',
            'add_to_cart',
            'remove_from_cart',
            'checkout_start',
            'checkout_complete',
            'purchase',
            'search',
            'filter',
            'review_submit',
            'wishlist_add',
            'wishlist_remove',
            'login',
            'register',
            'logout',
            'email_click',
            'sms_click'
        ],
        index: true
    },
    
    // المستخدم
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    
    sessionId: {
        type: String,
        required: [true, 'معرف الجلسة مطلوب'],
        index: true
    },
    
    // البيانات الإضافية
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // معلومات المنتج (إذا كان الحدث متعلق بمنتج)
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    
    // معلومات الطلب (إذا كان الحدث متعلق بطلب)
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    
    // معلومات البحث
    searchQuery: {
        type: String,
        trim: true
    },
    
    // معلومات الفلترة
    filters: {
        type: mongoose.Schema.Types.Mixed
    },
    
    // الموقع
    location: {
        type: LocationSchema
    },
    
    // معلومات المتصفح
    userAgent: {
        type: String,
        trim: true
    },
    
    // IP Address
    ip: {
        type: String,
        trim: true
    },
    
    // معلومات الجهاز
    device: {
        type: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet', 'other']
        },
        os: String,
        browser: String
    },
    
    // القيمة (للأحداث المالية)
    value: {
        type: Number,
        min: 0
    },
    
    // العملة
    currency: {
        type: String,
        default: 'SAR'
    },
    
    // الوقت
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Indexes
AnalyticsSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsSchema.index({ userId: 1, timestamp: -1 });
AnalyticsSchema.index({ sessionId: 1, timestamp: -1 });
AnalyticsSchema.index({ product: 1, timestamp: -1 });
AnalyticsSchema.index({ timestamp: -1 });
// Compound index للاستعلامات الشائعة
AnalyticsSchema.index({ eventType: 1, timestamp: -1, userId: 1 });

// Static method للحصول على إحصائيات الأحداث
AnalyticsSchema.statics.getEventStats = async function(eventType, startDate, endDate) {
    const match = {
        eventType: eventType
    };
    
    if (startDate || endDate) {
        match.timestamp = {};
        if (startDate) match.timestamp.$gte = new Date(startDate);
        if (endDate) match.timestamp.$lte = new Date(endDate);
    }
    
    return await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                totalValue: { $sum: '$value' },
                avgValue: { $avg: '$value' }
            }
        }
    ]);
};

// Static method للحصول على أحداث المستخدم
AnalyticsSchema.statics.getUserEvents = async function(userId, limit = 50) {
    return await this.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('product', 'name image')
        .populate('order', 'orderId total');
};

// Static method للحصول على أحداث المنتج
AnalyticsSchema.statics.getProductEvents = async function(productId, eventType = null, limit = 100) {
    const query = { product: productId };
    if (eventType) query.eventType = eventType;
    
    return await this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);
};

// Static method للحصول على إحصائيات التحويل
AnalyticsSchema.statics.getConversionFunnel = async function(startDate, endDate) {
    const match = {};
    if (startDate || endDate) {
        match.timestamp = {};
        if (startDate) match.timestamp.$gte = new Date(startDate);
        if (endDate) match.timestamp.$lte = new Date(endDate);
    }
    
    return await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$eventType',
                count: { $sum: 1 },
                uniqueUsers: { $addToSet: '$userId' },
                totalValue: { $sum: '$value' }
            }
        },
        {
            $project: {
                eventType: '$_id',
                count: 1,
                uniqueUsers: { $size: '$uniqueUsers' },
                totalValue: 1
            }
        },
        { $sort: { count: -1 } }
    ]);
};

// Static method للحصول على المنتجات الأكثر مشاهدة
AnalyticsSchema.statics.getTopViewedProducts = async function(limit = 10, startDate, endDate) {
    const match = {
        eventType: 'product_view'
    };
    
    if (startDate || endDate) {
        match.timestamp = {};
        if (startDate) match.timestamp.$gte = new Date(startDate);
        if (endDate) match.timestamp.$lte = new Date(endDate);
    }
    
    return await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$product',
                views: { $sum: 1 },
                uniqueViews: { $addToSet: '$userId' }
            }
        },
        {
            $project: {
                product: '$_id',
                views: 1,
                uniqueViews: { $size: '$uniqueViews' }
            }
        },
        { $sort: { views: -1 } },
        { $limit: limit }
    ]);
};

const Analytics = mongoose.model('Analytics', AnalyticsSchema);

module.exports = Analytics;




















