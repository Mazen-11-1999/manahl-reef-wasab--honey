/**
 * WebAuthn Credential Model
 * نموذج لحفظ بيانات البصمة للمصادقة
 */

const mongoose = require('mongoose');

const WebAuthnCredentialSchema = new mongoose.Schema({
    // معرف فريد للبصمة
    credentialID: {
        type: String,
        required: true,
        unique: true
    },
    
    // معرف المستخدم (admin فقط)
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // المفتاح العام للبصمة
    publicKey: {
        type: String,
        required: true
    },
    
    // عدد المرات التي تم استخدام البصمة فيها
    counter: {
        type: Number,
        default: 0
    },
    
    // اسم الجهاز (اختياري)
    deviceName: {
        type: String,
        default: 'جهاز غير معروف'
    },
    
    // نوع الجهاز (اختياري)
    deviceType: {
        type: String,
        enum: ['phone', 'tablet', 'desktop', 'unknown'],
        default: 'unknown'
    },
    
    // تاريخ الإنشاء
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // آخر استخدام
    lastUsed: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes
WebAuthnCredentialSchema.index({ userID: 1 });
WebAuthnCredentialSchema.index({ credentialID: 1 });

const WebAuthnCredential = mongoose.model('WebAuthnCredential', WebAuthnCredentialSchema);

module.exports = WebAuthnCredential;








