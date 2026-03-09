/**
 * Payment Model
 * نموذج الدفعات - مناحل ريف وصاب
 */

const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'الطلب مطلوب']
    },
    
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'العميل مطلوب']
    },
    
    method: {
        type: String,
        enum: ['credit_card', 'paypal', 'cash_on_delivery', 'bank_transfer', 'stripe'],
        required: [true, 'طريقة الدفع مطلوبة']
    },
    
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    
    amount: {
        type: Number,
        required: [true, 'المبلغ مطلوب'],
        min: [0, 'المبلغ يجب أن يكون موجباً']
    },
    
    currency: {
        type: String,
        default: 'SAR',
        enum: ['SAR', 'USD', 'EUR']
    },
    
    // معلومات المعاملة
    transactionId: {
        type: String,
        trim: true
    },
    
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    
    // معلومات البطاقة (مشفرة)
    cardInfo: {
        last4: String,
        brand: String,
        expiryMonth: Number,
        expiryYear: Number
    },
    
    // معلومات الاسترداد
    refund: {
        amount: Number,
        reason: String,
        processedAt: Date,
        transactionId: String
    },
    
    // معلومات إضافية
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    
    // التواريخ
    processedAt: {
        type: Date
    },
    
    failedAt: {
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

// Indexes
PaymentSchema.index({ order: 1 });
PaymentSchema.index({ customer: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ method: 1, status: 1 });

// Virtual للتحقق من نجاح الدفع
PaymentSchema.virtual('isSuccessful').get(function() {
    return this.status === 'completed';
});

// Virtual للتحقق من فشل الدفع
PaymentSchema.virtual('isFailed').get(function() {
    return this.status === 'failed' || this.status === 'cancelled';
});

// تحديث حالة الدفع
PaymentSchema.methods.updateStatus = function(status, transactionId = null, gatewayResponse = null) {
    this.status = status;
    
    if (transactionId) {
        this.transactionId = transactionId;
    }
    
    if (gatewayResponse) {
        this.gatewayResponse = gatewayResponse;
    }
    
    if (status === 'completed') {
        this.processedAt = new Date();
    } else if (status === 'failed' || status === 'cancelled') {
        this.failedAt = new Date();
    }
    
    this.updatedAt = new Date();
    return this.save();
};

// معالجة الاسترداد
PaymentSchema.methods.processRefund = function(amount, reason, transactionId) {
    if (this.status !== 'completed') {
        throw new Error('لا يمكن استرداد دفعة غير مكتملة');
    }
    
    if (amount > this.amount) {
        throw new Error('مبلغ الاسترداد لا يمكن أن يكون أكبر من المبلغ الأصلي');
    }
    
    this.status = 'refunded';
    this.refund = {
        amount: amount,
        reason: reason,
        processedAt: new Date(),
        transactionId: transactionId
    };
    this.updatedAt = new Date();
    return this.save();
};

// Pre-save middleware
PaymentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;




















