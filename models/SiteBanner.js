/**
 * Site Banner Model
 * نموذج الشريط العلوي المتحرك - إعلان/ترويج من لوحة التحكم
 */

const mongoose = require('mongoose');

const SiteBannerSchema = new mongoose.Schema({
    // النص المعروض في الشريط
    text: {
        type: String,
        required: [true, 'نص الشريط مطلوب'],
        trim: true,
        maxlength: [500, 'النص لا يمكن أن يتجاوز ٥٠٠ حرف']
    },
    // رابط اختياري عند النقر على الشريط
    link: {
        type: String,
        trim: true,
        maxlength: [500, 'الرابط طويل جداً']
    },
    // تفعيل/إيقاف الشريط
    active: {
        type: Boolean,
        default: true
    },
    // سرعة الحركة: slow | medium | fast
    speed: {
        type: String,
        enum: ['slow', 'medium', 'fast'],
        default: 'medium'
    },
    // لون الخلفية (اختياري) للتوافق مع الموقع
    backgroundColor: {
        type: String,
        trim: true,
        default: ''
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

// نستخدم وثيقة واحدة فقط (singleton)
SiteBannerSchema.index({ _id: 1 });

const SiteBanner = mongoose.model('SiteBanner', SiteBannerSchema);

module.exports = SiteBanner;
