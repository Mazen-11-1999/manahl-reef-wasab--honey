/**
 * Customer Model
 * نموذج العميل - مناحل ريف وصاب
 */

const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home'
    },
    street: {
        type: String,
        required: [true, 'اسم الشارع مطلوب'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'اسم المدينة مطلوب'],
        trim: true
    },
    region: {
        type: String,
        trim: true // المحافظة أو المنطقة
    },
    country: {
        type: String,
        trim: true,
        default: 'اليمن'
    },
    postalCode: {
        type: String,
        trim: true
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 200
    }
}, { _id: true });

const CustomerSchema = new mongoose.Schema({
    // ربط مع User
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // معلومات الاتصال
    email: {
        type: String,
        required: [true, 'البريد الإلكتروني مطلوب'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'البريد الإلكتروني غير صحيح']
    },
    
    phone: {
        type: String,
        required: [true, 'رقم الهاتف مطلوب'],
        trim: true
    },
    
    // الملف الشخصي
    profile: {
        firstName: {
            type: String,
            trim: true
        },
        lastName: {
            type: String,
            trim: true
        },
        dateOfBirth: {
            type: Date
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        },
        avatar: {
            type: String
        }
    },
    
    // العناوين
    addresses: [AddressSchema],
    
    // التفضيلات
    preferences: {
        categories: [{
            type: String,
            enum: ['honey-sidr', 'honey-sumra', 'therapeutic-mix']
        }],
        allergies: [{
            type: String,
            trim: true
        }],
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true },
            orders: { type: Boolean, default: true },
            products: { type: Boolean, default: true },
            contests: { type: Boolean, default: false },
            system: { type: Boolean, default: false }
        }
    },
    
    // برنامج الولاء
    loyalty: {
        points: {
            type: Number,
            default: 0,
            min: 0
        },
        tier: {
            type: String,
            enum: ['bronze', 'silver', 'gold', 'platinum', 'VIP'],
            default: 'bronze'
        },
        totalSpent: {
            type: Number,
            default: 0,
            min: 0
        },
        totalOrders: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // نظام العملاء الموثوقين
    trusted: {
        enabled: {
            type: Boolean,
            default: false
        },
        creditLimit: {
            type: Number,
            default: 0,
            min: 0
        },
        creditUsed: {
            type: Number,
            default: 0,
            min: 0
        },
        creditAvailable: {
            type: Number,
            default: 0,
            min: 0
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    
    // معلومات الموقع
    location: {
        country: {
            type: String,
            trim: true,
            default: 'اليمن'
        },
        region: {
            type: String,
            trim: true // المحافظة أو المنطقة
        },
        city: {
            type: String,
            trim: true
        }
    },
    
    // قائمة الأمنيات
    wishlist: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // الحالة
    isActive: {
        type: Boolean,
        default: true
    },
    
    // إحصائيات
    stats: {
        lastOrderDate: Date,
        lastLoginDate: Date,
        totalOrders: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 }
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
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ user: 1 });
CustomerSchema.index({ 'loyalty.tier': 1 });
CustomerSchema.index({ createdAt: -1 });
CustomerSchema.index({ 'trusted.enabled': 1 });
CustomerSchema.index({ 'location.country': 1, 'location.region': 1 });

// Virtual للحصول على الاسم الكامل
CustomerSchema.virtual('fullName').get(function() {
    if (this.profile.firstName && this.profile.lastName) {
        return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.email;
});

// Virtual للحصول على العنوان الافتراضي
CustomerSchema.virtual('defaultAddress').get(function() {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// تحديث tier بناءً على النقاط
CustomerSchema.methods.updateLoyaltyTier = function() {
    const points = this.loyalty.points;
    
    if (points >= 10000) {
        this.loyalty.tier = 'platinum';
    } else if (points >= 5000) {
        this.loyalty.tier = 'gold';
    } else if (points >= 2000) {
        this.loyalty.tier = 'silver';
    } else {
        this.loyalty.tier = 'bronze';
    }
    
    return this.save();
};

// إضافة نقاط الولاء
CustomerSchema.methods.addLoyaltyPoints = async function(points) {
    this.loyalty.points += points;
    await this.updateLoyaltyTier();
    return this;
};

// إضافة منتج لقائمة الأمنيات
CustomerSchema.methods.addToWishlist = function(productId) {
    const exists = this.wishlist.some(item => item.product.toString() === productId.toString());
    if (!exists) {
        this.wishlist.push({ product: productId });
        return this.save();
    }
    return Promise.resolve(this);
};

// إزالة منتج من قائمة الأمنيات
CustomerSchema.methods.removeFromWishlist = function(productId) {
    this.wishlist = this.wishlist.filter(
        item => item.product.toString() !== productId.toString()
    );
    return this.save();
};

// Method لتحديث الرصيد المتاح
CustomerSchema.methods.updateCreditAvailable = function() {
    if (this.trusted && this.trusted.enabled) {
        this.trusted.creditAvailable = Math.max(0, this.trusted.creditLimit - this.trusted.creditUsed);
    }
    return this.save();
};

// Method لاستخدام الرصيد
CustomerSchema.methods.useCredit = async function(amount) {
    if (!this.trusted || !this.trusted.enabled) {
        throw new Error('العميل غير موثوق أو غير مفعل');
    }
    
    if (this.trusted.creditUsed + amount > this.trusted.creditLimit) {
        throw new Error('تجاوز حد الرصيد المتاح');
    }
    
    this.trusted.creditUsed += amount;
    await this.updateCreditAvailable();
    return this;
};

// Method لسداد الرصيد
CustomerSchema.methods.payCredit = async function(amount) {
    if (!this.trusted || !this.trusted.enabled) {
        throw new Error('العميل غير موثوق أو غير مفعل');
    }
    
    this.trusted.creditUsed = Math.max(0, this.trusted.creditUsed - amount);
    await this.updateCreditAvailable();
    return this;
};

// Pre-save middleware
CustomerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // تحديث الرصيد المتاح تلقائياً
    if (this.trusted && this.trusted.enabled) {
        this.trusted.creditAvailable = Math.max(0, this.trusted.creditLimit - this.trusted.creditUsed);
    }
    
    next();
});

const Customer = mongoose.model('Customer', CustomerSchema);

module.exports = Customer;











