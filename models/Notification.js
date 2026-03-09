/**
 * Notification Model
 * نموذج الإشعارات داخل التطبيق
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    
    type: {
        type: String,
        enum: [
            'order_created',
            'order_status_changed',
            'order_shipped',
            'order_delivered',
            'order_completed',
            'payment_received',
            'shipping_receipt_uploaded',
            'review_added',
            'system_announcement'
        ],
        required: true
    },
    
    title: {
        type: String,
        required: true,
        trim: true
    },
    
    message: {
        type: String,
        required: true,
        trim: true
    },
    
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    read: {
        type: Boolean,
        default: false
    },
    
    readAt: {
        type: Date
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ customer: 1, createdAt: -1 });
NotificationSchema.index({ order: 1 });
NotificationSchema.index({ type: 1 });

// Static method لإنشاء إشعار
NotificationSchema.statics.createNotification = async function(userId, type, title, message, data = {}) {
    return await this.create({
        user: userId,
        type: type,
        title: title,
        message: message,
        data: data
    });
};

// Static method للحصول على إشعارات غير مقروءة
NotificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({
        user: userId,
        read: false
    });
};

// Static method لقراءة جميع الإشعارات
NotificationSchema.statics.markAllAsRead = async function(userId) {
    return await this.updateMany(
        { user: userId, read: false },
        { read: true, readAt: new Date() }
    );
};

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;



















