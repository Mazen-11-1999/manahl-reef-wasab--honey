/**
 * Review Model
 * نموذج التقييمات - مناحل ريف وصاب
 */

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'المنتج مطلوب']
    },
    
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'العميل مطلوب']
    },
    
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    
    rating: {
        type: Number,
        required: [true, 'التقييم مطلوب'],
        min: [1, 'التقييم يجب أن يكون على الأقل 1'],
        max: [5, 'التقييم يجب أن يكون على الأكثر 5']
    },
    
    title: {
        type: String,
        trim: true,
        maxlength: [100, 'العنوان يجب أن يكون أقل من 100 حرف']
    },
    
    comment: {
        type: String,
        trim: true,
        maxlength: [1000, 'التعليق يجب أن يكون أقل من 1000 حرف']
    },
    
    images: [{
        type: String,
        trim: true
    }],
    
    // إحصائيات
    helpful: {
        type: Number,
        default: 0,
        min: 0
    },
    
    helpfulUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    }],
    
    notHelpful: {
        type: Number,
        default: 0,
        min: 0
    },
    
    notHelpfulUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    }],
    
    // التحقق
    verified: {
        type: Boolean,
        default: false
    },
    
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    
    // الحالة
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'hidden'],
        default: 'pending'
    },
    
    // رد البائع
    reply: {
        text: {
            type: String,
            trim: true,
            maxlength: 500
        },
        repliedAt: {
            type: Date
        },
        repliedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
ReviewSchema.index({ product: 1, status: 1 });
ReviewSchema.index({ customer: 1 });
ReviewSchema.index({ order: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ helpful: -1 });
// Compound index لمنع التقييمات المكررة
ReviewSchema.index({ product: 1, customer: 1 }, { unique: true });

// Virtual للتحقق من الموافقة
ReviewSchema.virtual('isApproved').get(function() {
    return this.status === 'approved';
});

// إضافة تقييم مفيد (إن كان المستخدم قد اختار غير مفيد ننقله لمفيد)
ReviewSchema.methods.markHelpful = function(customerId) {
    const cid = customerId.toString();
    const inHelpful = this.helpfulUsers.some(id => id.toString() === cid);
    const notHelpfulList = this.notHelpfulUsers || [];
    const inNotHelpful = notHelpfulList.findIndex(id => id.toString() === cid);
    if (inHelpful) return Promise.resolve(this);
    if (inNotHelpful !== -1) {
        this.notHelpfulUsers = notHelpfulList;
        this.notHelpfulUsers.splice(inNotHelpful, 1);
        this.notHelpful = Math.max(0, (this.notHelpful || 0) - 1);
    }
    this.helpfulUsers.push(customerId);
    this.helpful += 1;
    return this.save();
};

// إزالة تقييم مفيد
ReviewSchema.methods.unmarkHelpful = function(customerId) {
    const index = this.helpfulUsers.findIndex(
        id => id.toString() === customerId.toString()
    );
    if (index !== -1) {
        this.helpfulUsers.splice(index, 1);
        this.helpful = Math.max(0, this.helpful - 1);
        return this.save();
    }
    return Promise.resolve(this);
};

// إضافة تقييم غير مفيد (إن كان المستخدم قد اختار مفيد ننقله لغير مفيد)
ReviewSchema.methods.markNotHelpful = function(customerId) {
    const cid = customerId.toString();
    const alreadyNotHelpful = (this.notHelpfulUsers || []).some(id => id.toString() === cid);
    const inHelpful = this.helpfulUsers.findIndex(id => id.toString() === cid);
    if (alreadyNotHelpful) return Promise.resolve(this);
    if (inHelpful !== -1) {
        this.helpfulUsers.splice(inHelpful, 1);
        this.helpful = Math.max(0, this.helpful - 1);
    }
    this.notHelpfulUsers = this.notHelpfulUsers || [];
    this.notHelpfulUsers.push(customerId);
    this.notHelpful = (this.notHelpful || 0) + 1;
    return this.save();
};

// الموافقة على التقييم
ReviewSchema.methods.approve = function() {
    this.status = 'approved';
    this.updatedAt = new Date();
    return this.save();
};

// رفض التقييم
ReviewSchema.methods.reject = function() {
    this.status = 'rejected';
    this.updatedAt = new Date();
    return this.save();
};

// إضافة رد
ReviewSchema.methods.addReply = function(text, userId) {
    this.reply = {
        text: text,
        repliedAt: new Date(),
        repliedBy: userId
    };
    this.updatedAt = new Date();
    return this.save();
};

// Static method لحساب متوسط التقييمات لمنتج
ReviewSchema.statics.getAverageRating = async function(productId) {
    const result = await this.aggregate([
        {
            $match: {
                product: mongoose.Types.ObjectId(productId),
                status: 'approved'
            }
        },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                ratings: {
                    $push: '$rating'
                }
            }
        }
    ]);
    
    if (result.length === 0) {
        return {
            average: 0,
            count: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }
    
    const data = result[0];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    data.ratings.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
    });
    
    return {
        average: Math.round(data.averageRating * 10) / 10,
        count: data.totalReviews,
        distribution: distribution
    };
};

// Pre-save middleware
ReviewSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Post-save middleware - تحديث متوسط التقييمات للمنتج
ReviewSchema.post('save', async function() {
    if (this.status === 'approved') {
        const Product = mongoose.model('Product');
        const ratingData = await ReviewSchema.statics.getAverageRating(this.product);
        
        await Product.findByIdAndUpdate(this.product, {
            'ratings.average': ratingData.average,
            'ratings.count': ratingData.count
        });
    }
});

const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review;




















