/**
 * Push Subscription Model
 * نموذج حفظ اشتراكات Push Notifications (مجاني تماماً)
 */

const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    subscription: {
        endpoint: {
            type: String,
            required: true,
            unique: true
        },
        keys: {
            p256dh: {
                type: String,
                required: true
            },
            auth: {
                type: String,
                required: true
            }
        }
    },
    userAgent: {
        type: String,
        trim: true
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
    timestamps: true
});

// Indexes
PushSubscriptionSchema.index({ userId: 1, 'subscription.endpoint': 1 });
PushSubscriptionSchema.index({ createdAt: -1 });

// Pre-save hook
PushSubscriptionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const PushSubscription = mongoose.model('PushSubscription', PushSubscriptionSchema);

module.exports = PushSubscription;










