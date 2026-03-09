/**
 * Product Model
 * نموذج المنتج
 */

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'اسم المنتج مطلوب'],
        trim: true,
        maxlength: [200, 'اسم المنتج لا يمكن أن يكون أطول من 200 حرف']
    },
    category: { 
        type: String, 
        required: [true, 'فئة المنتج مطلوبة'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'الوصف لا يمكن أن يكون أطول من 2000 حرف']
    },
    price: { 
        type: Number, 
        required: [true, 'سعر المنتج مطلوب'],
        min: [0, 'السعر لا يمكن أن يكون سالباً']
    },
    oldPrice: {
        type: Number,
        min: [0, 'السعر القديم لا يمكن أن يكون سالباً']
    },
    stock: { 
        type: Number, 
        default: 0,
        min: [0, 'الكمية المتاحة لا يمكن أن تكون سالبة']
    },
    /** أقل كمية يمكن شراؤها من المنتج (للاستخدام في العروض أو طلبات الجملة) */
    minOrder: {
        type: Number,
        default: 1,
        min: [1, 'الحد الأدنى للطلب يجب أن يكون 1 على الأقل']
    },
    image: {
        type: String,
        trim: true
    },
    images: [{
        type: String,
        trim: true
    }],
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        uppercase: true
    },
    /** شارة خصم خاص - تظهر في الواجهة الأمامية إذا كانت true */
    onSale: {
        type: Boolean,
        default: false
    },
    featured: { 
        type: Boolean, 
        default: false 
    },
    /** هل المنتج متاح للشراء في المتجر أم معطّل */
    isActive: {
        type: Boolean,
        default: true
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'out_of_stock', 'discontinued', 'draft'],
        default: 'active' 
    },
    ratings: {
        average: { 
            type: Number, 
            default: 0, 
            min: 0, 
            max: 5 
        },
        count: { 
            type: Number, 
            default: 0, 
            min: 0 
        }
    },
    tags: [{
        type: String,
        trim: true
    }],
    weight: {
        type: Number,
        min: [0, 'الوزن لا يمكن أن يكون سالباً']
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
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
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ 'ratings.average': -1 });
ProductSchema.index({ createdAt: -1 });

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function() {
    if (this.oldPrice && this.oldPrice > this.price) {
        return Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
    }
    return 0;
});

// Virtual for isInStock
ProductSchema.virtual('isInStock').get(function() {
    return this.stock > 0 && this.status === 'active';
});

// Pre-save middleware to update updatedAt
ProductSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to update average rating
ProductSchema.statics.updateAverageRating = async function(productId) {
    const Review = require('./Review');
    const stats = await Review.aggregate([
        {
            $match: { product: mongoose.Types.ObjectId(productId) }
        },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                numRatings: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await this.findByIdAndUpdate(productId, {
            'ratings.average': Math.round(stats[0].averageRating * 10) / 10,
            'ratings.count': stats[0].numRatings
        });
    } else {
        await this.findByIdAndUpdate(productId, {
            'ratings.average': 0,
            'ratings.count': 0
        });
    }
};

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;











