/**
 * User Model
 * نموذج المستخدم مع تشفير كلمات المرور
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'اسم المستخدم مطلوب'],
        unique: true,
        trim: true,
        minlength: [3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'],
        maxlength: [30, 'اسم المستخدم يجب أن يكون 30 حرفاً على الأكثر']
    },
    email: {
        type: String,
        required: [true, 'البريد الإلكتروني مطلوب'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'البريد الإلكتروني غير صحيح']
    },
    password: {
        type: String,
        required: [true, 'كلمة المرور مطلوبة'],
        minlength: [8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'],
        select: false // لا يتم جلب كلمة المرور افتراضياً
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    profile: {
        firstName: {
            type: String,
            trim: true
        },
        lastName: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        address: {
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
    vipStatus: {
        type: Boolean,
        default: false
    },
    vipExpiryDate: {
        type: Date
    },
    /** شارة العميل: none = بدون، premium = عميل مميز، active-member = عضو فعال، honey-friend = صديق العسل، trusted-partner = شريك موثوق، new-client = عميل جديد، sultan = سلطان العسل، vip = VIP مناحل ريف وصاب (يدوي من لوحة التحكم)، owner = المالك (للمشرف فقط) */
    badgeType: {
        type: String,
        enum: ['none', 'premium', 'active-member', 'honey-friend', 'trusted-partner', 'new-client', 'sultan', 'vip', 'owner'],
        default: 'none'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    lastLogin: {
        type: Date
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

// Indexes لتحسين الأداء
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ 'profile.phone': 1 });
UserSchema.index({ createdAt: -1 });

// Virtual للحصول على الاسم الكامل
UserSchema.virtual('fullName').get(function () {
    if (this.profile.firstName && this.profile.lastName) {
        return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.username;
});

// تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function (next) {
    // إذا لم يتم تعديل كلمة المرور، تخطى التشفير
    if (!this.isModified('password')) return next();

    // تشفير كلمة المرور
    this.password = await bcrypt.hash(this.password, config.bcryptRounds);
    next();
});

// تحديث updatedAt قبل التحديث
UserSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: new Date() });
    next();
});

// دالة لمقارنة كلمة المرور
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// دالة لإنشاء JWT Token
UserSchema.methods.generateAuthToken = function () {
    const jwt = require('jsonwebtoken');
    const config = require('../config/env');

    return jwt.sign(
        {
            id: this._id,
            username: this.username,
            role: this.role
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpire }
    );
};

// دالة لإنشاء Refresh Token
UserSchema.methods.generateRefreshToken = function () {
    const jwt = require('jsonwebtoken');
    const config = require('../config/env');

    return jwt.sign(
        { id: this._id },
        config.jwtRefreshSecret,
        { expiresIn: config.jwtRefreshExpire }
    );
};

// دالة لإنشاء Password Reset Token
UserSchema.methods.createPasswordResetToken = function () {
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

// دالة لإنشاء Email Verification Token
UserSchema.methods.createEmailVerificationToken = function () {
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    return verificationToken;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;




















