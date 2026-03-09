/**
 * Site Settings Model
 * إعدادات الموقع (واحدة فقط - singleton)
 */

const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
    storeName: { type: String, trim: true, default: 'مناحل ريف وصاب' },
    storeNameEn: { type: String, trim: true, default: 'Reef Wasab Apiaries' },
    logoUrl: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: 'صنعاء - اليمن' },
    phone: { type: String, trim: true, default: '' },
    whatsappPhone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    tiktok: { type: String, trim: true, default: '' },
    snapchat: { type: String, trim: true, default: '' },
    facebook: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' },
    maintenanceMode: { type: Boolean, default: false },
    showPrices: { type: Boolean, default: true },
    allowOrders: { type: Boolean, default: true },
    allowReviews: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false },
    /** معرض صور صفحة قصتنا (6 صور كحد أقصى) */
    storyGallery: [{
        url: { type: String, trim: true, default: '' },
        caption: { type: String, trim: true, default: '' }
    }],
    /** طرق الدفع (تحويل بنكي، حوالة مالية، رقم هاتف، بطاقة، إلخ) — تظهر للزبون عند اختيار التحويل */
    paymentMethods: [{
        type: { type: String, enum: ['bank', 'hawala', 'phone', 'card', 'other'], default: 'bank' },
        label: { type: String, trim: true, default: '' },
        bankName: { type: String, trim: true, default: '' },
        accountHolder: { type: String, trim: true, default: '' },
        accountNumber: { type: String, trim: true, default: '' },
        iban: { type: String, trim: true, default: '' },
        hawalaOfficeName: { type: String, trim: true, default: '' },
        recipientName: { type: String, trim: true, default: '' },
        recipientPhone: { type: String, trim: true, default: '' },
        branchOrAgent: { type: String, trim: true, default: '' },
        phoneNumber: { type: String, trim: true, default: '' },
        cardNumber: { type: String, trim: true, default: '' },
        holderName: { type: String, trim: true, default: '' },
        note: { type: String, trim: true, default: '' }
    }],
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

SiteSettingsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const SiteSettings = mongoose.model('SiteSettings', SiteSettingsSchema);

module.exports = SiteSettings;
