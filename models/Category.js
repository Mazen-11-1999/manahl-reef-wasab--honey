/**
 * Category Model
 * نموذج فئة المنتجات
 */

const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'اسم الفئة مطلوب'],
        trim: true,
        unique: true,
        maxlength: [100, 'اسم الفئة لا يمكن أن يكون أطول من 100 حرف']
    },
    slug: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'الوصف لا يمكن أن يكون أطول من 500 حرف']
    },
    image: {
        type: String,
        trim: true
    },
    icon: {
        type: String,
        trim: true,
        default: '📦'
    },
    order: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    productsCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// إنشاء slug تلقائياً من الاسم
CategorySchema.pre('save', function(next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u0621-\u064A-]/g, '')
            .replace(/-+/g, '-')
            .trim();
        // إذا كان الاسم عربي فقط، نستخدم اسم مبسط
        if (!this.slug || this.slug === '-') {
            this.slug = 'cat-' + Date.now();
        }
    }
    next();
});

module.exports = mongoose.model('Category', CategorySchema);






