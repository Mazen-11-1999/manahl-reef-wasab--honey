/**
 * Health Info Model
 * نموذج المعلومات الطبية - صيدلية ريف وصاب الطبيعية
 */

const mongoose = require('mongoose');

const HealthInfoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'العنوان مطلوب'],
        trim: true,
        maxlength: [200, 'العنوان لا يمكن أن يكون أطول من 200 حرف']
    },
    description: {
        type: String,
        required: [true, 'الوصف مطلوب'],
        trim: true,
        maxlength: [2000, 'الوصف لا يمكن أن يكون أطول من 2000 حرف']
    },
    // الفئة الصحية
    healthCategory: {
        type: String,
        required: [true, 'الفئة الصحية مطلوبة'],
        enum: ['immunity', 'digestion', 'energy', 'skin', 'heart', 'diabetes', 'blood_pressure', 'respiratory', 'brain', 'bones', 'other'],
        default: 'other'
    },
    // الحالة الصحية (اختياري)
    healthCondition: {
        type: String,
        trim: true,
        maxlength: [100, 'الحالة الصحية لا يمكن أن تكون أطول من 100 حرف']
    },
    // المنتج المرتبط (اختياري)
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    // الفوائد (قائمة)
    benefits: [{
        type: String,
        trim: true,
        maxlength: [500, 'كل فائدة لا يمكن أن تكون أطول من 500 حرف']
    }],
    // طريقة الاستخدام (اختياري)
    usageInstructions: {
        type: String,
        trim: true,
        maxlength: [1000, 'طريقة الاستخدام لا يمكن أن تكون أطول من 1000 حرف']
    },
    // الجرعة المناسبة (اختياري)
    dosage: {
        type: String,
        trim: true,
        maxlength: [200, 'الجرعة لا يمكن أن تكون أطول من 200 حرف']
    },
    // أفضل الأوقات (اختياري)
    bestTimes: [{
        type: String,
        trim: true
    }],
    // تحذيرات (اختياري)
    warnings: {
        type: String,
        trim: true,
        maxlength: [1000, 'التحذيرات لا يمكن أن تكون أطول من 1000 حرف']
    },
    // تفاعلات دوائية محتملة (اختياري)
    drugInteractions: {
        type: String,
        trim: true,
        maxlength: [500, 'التفاعلات الدوائية لا يمكن أن تكون أطول من 500 حرف']
    },
    // مصدر علمي (اختياري)
    scientificSource: {
        type: String,
        trim: true,
        maxlength: [500, 'المصدر العلمي لا يمكن أن يكون أطول من 500 حرف']
    },
    // رابط دراسة (اختياري)
    studyLink: {
        type: String,
        trim: true
    },
    // صورة (اختياري)
    image: {
        type: String,
        trim: true
    },
    // أيقونة (اختياري)
    icon: {
        type: String,
        trim: true,
        default: '🏥'
    },
    // الأولوية
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    // حالة النشر
    active: {
        type: Boolean,
        default: true
    },
    // نوع المحتوى
    contentType: {
        type: String,
        enum: ['benefit', 'recipe', 'usage_tip', 'study', 'warning'],
        default: 'benefit'
    },
    // وصفة طبيعية (إذا كان contentType = 'recipe')
    recipe: {
        ingredients: [{
            name: String,
            quantity: String
        }],
        steps: [{
            type: String,
            trim: true
        }],
        duration: String, // مدة التحضير
        servings: String // عدد الحصص
    },
    // عدد المشاهدات
    views: {
        type: Number,
        default: 0
    },
    // عدد الإعجابات
    likes: {
        type: Number,
        default: 0
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
HealthInfoSchema.index({ healthCategory: 1, active: 1 });
HealthInfoSchema.index({ product: 1 });
HealthInfoSchema.index({ contentType: 1, active: 1 });
HealthInfoSchema.index({ priority: 1 });
HealthInfoSchema.index({ createdAt: -1 });

// Virtual for health category name
HealthInfoSchema.virtual('healthCategoryName').get(function() {
    const categories = {
        'immunity': 'المناعة',
        'digestion': 'الهضم',
        'energy': 'الطاقة',
        'skin': 'البشرة',
        'heart': 'القلب',
        'diabetes': 'السكري',
        'blood_pressure': 'الضغط',
        'respiratory': 'الجهاز التنفسي',
        'brain': 'الدماغ',
        'bones': 'العظام',
        'other': 'أخرى'
    };
    return categories[this.healthCategory] || 'أخرى';
});

// Virtual for priority name
HealthInfoSchema.virtual('priorityName').get(function() {
    const priorities = {
        'high': 'مهمة',
        'medium': 'عادية',
        'low': 'إضافية'
    };
    return priorities[this.priority] || 'عادية';
});

// Virtual for content type name
HealthInfoSchema.virtual('contentTypeName').get(function() {
    const types = {
        'benefit': 'فائدة صحية',
        'recipe': 'وصفة طبيعية',
        'usage_tip': 'نصيحة استخدام',
        'study': 'دراسة علمية',
        'warning': 'تحذير مهم'
    };
    return types[this.contentType] || 'فائدة صحية';
});

// Method to increment views
HealthInfoSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Method to toggle like
HealthInfoSchema.methods.toggleLike = function() {
    this.likes += 1;
    return this.save();
};

const HealthInfo = mongoose.model('HealthInfo', HealthInfoSchema);

module.exports = HealthInfo;







