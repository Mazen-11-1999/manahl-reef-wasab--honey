/**
 * Contest Settings Model
 * إعدادات المسابقات (السحب التلقائي، إشعارات الفائزين، نشر النتائج...)
 * يُخزّن مستند واحد فقط للإعدادات العامة.
 */

const mongoose = require('mongoose');

const ContestSettingsSchema = new mongoose.Schema({
    // السحب التلقائي عند انتهاء المسابقة
    autoDraw: { type: Boolean, default: false },
    // إشعار الفائزين (واتساب/إيميل لاحقاً)
    winnerNotifications: { type: Boolean, default: true },
    // نشر النتائج تلقائياً بعد السحب
    autoPublish: { type: Boolean, default: true },
    // التحقق من المشاركين قبل السحب
    verifyParticipants: { type: Boolean, default: true },
    // سجل الأنشطة الكامل
    fullActivityLog: { type: Boolean, default: false },
    // وضع الصيانة (إيقاف المسابقات مؤقتاً)
    maintenanceMode: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'contestsettings', timestamps: false });

// نضمن مستنداً واحداً فقط
ContestSettingsSchema.statics.get = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({});
    }
    return doc;
};

ContestSettingsSchema.statics.updateSettings = async function (updates) {
    const doc = await this.get();
    Object.assign(doc, updates);
    doc.updatedAt = new Date();
    await doc.save();
    return doc;
};

const ContestSettings = mongoose.model('ContestSettings', ContestSettingsSchema);
module.exports = ContestSettings;
